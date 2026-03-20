"""
ExposureAssessment.py
Geospatial Exposure Assessment Module
Handles geospatial analysis calculations for hazard exposure
UPDATED: Added hazard level breakdown for flood data
UPDATED: Added support for point geometries
"""

from fastapi import HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import threading
import contextlib
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, LineString, MultiLineString
from shapely.ops import linemerge
import json
from io import StringIO
from functools import partial
import asyncio
from concurrent.futures import ProcessPoolExecutor
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Process pool for CPU-intensive tasks
process_pool = ProcessPoolExecutor(max_workers=4)


class ExposureAnalysisCancelled(Exception):
    """Raised when the client disconnects; stops cooperative cancellation in analyze_exposure."""


def _cancel_if_requested(cancel_event: Optional[threading.Event]) -> None:
    if cancel_event is not None and cancel_event.is_set():
        raise ExposureAnalysisCancelled("client disconnected")


class GeoJSONFeature(BaseModel):
    type: str
    geometry: Dict[str, Any]
    properties: Optional[Dict[str, Any]] = {}


class GeoJSONData(BaseModel):
    type: str
    features: List[GeoJSONFeature]


class ExposureAssessmentRequest(BaseModel):
    hazard_data: GeoJSONData
    element_data: GeoJSONData
    hazard_type: str
    analysis_area: str
    element_type: Optional[str] = None


class ElementResult(BaseModel):
    name: str
    exposedFeatures: int
    totalSurfaceArea: str
    affectedArea: str
    unaffectedArea: str
    totalFeatures: int
    landuseBreakdown: Optional[List[Dict[str, Any]]] = None
    hazardLevelBreakdown: Optional[List[Dict[str, Any]]] = None
    # Per administrative unit when element GeoJSON has shapeName (geoBoundaries)
    featureExposureBreakdown: Optional[List[Dict[str, Any]]] = None


class ExposureAssessmentResponse(BaseModel):
    hazardType: str
    analysisArea: str
    scope: str
    analysisTime: str
    elements: List[ElementResult]
    affectedGeometries: Optional[List[Dict[str, Any]]] = []
    unit: Optional[str] = "km²"


def analyze_exposure(hazard_geojson: dict, element_geojson: dict, element_name: str, element_type: str = None, hazard_type: str = None, skip_visualization: bool = False, cancel_event: Optional[threading.Event] = None) -> dict:
    """
    Perform exposure analysis using GeoPandas
    UPDATED: Added hazard level breakdown for flood data
    UPDATED: Added support for point geometries
    """
    try:
        logger.info(f"Starting analysis for {element_name}")
        if element_type:
            logger.info(f"Element type: {element_type}")
        if hazard_type:
            logger.info(f"Hazard type: {hazard_type}")
        
        _cancel_if_requested(cancel_event)

        # Convert GeoJSON to GeoDataFrames
        hazard_gdf = gpd.GeoDataFrame.from_features(hazard_geojson['features'])
        element_gdf = gpd.GeoDataFrame.from_features(element_geojson['features'])
        
        # Set CRS to WGS84
        hazard_gdf.crs = "EPSG:4326"
        element_gdf.crs = "EPSG:4326"
        
        logger.info(f"Loaded {len(element_gdf)} element features and {len(hazard_gdf)} hazard features")
        
        _cancel_if_requested(cancel_event)

        # Calculate appropriate UTM zone based on longitude of features
        bounds = element_gdf.total_bounds
        center_lon = (bounds[0] + bounds[2]) / 2
        
        utm_zone = int((center_lon + 180) / 6) + 1
        hemisphere = 'north' if (bounds[1] + bounds[3]) / 2 >= 0 else 'south'
        
        if hemisphere == 'north':
            target_crs = f'EPSG:{32600 + utm_zone}'
        else:
            target_crs = f'EPSG:{32700 + utm_zone}'
            
        logger.info(f"Auto-detected UTM zone: {utm_zone}{hemisphere[0].upper()}, using CRS: {target_crs}")
        
        # Project to calculated UTM for accurate area/length calculation
        logger.info(f"Reprojecting to {target_crs}")
        
        element_proj = element_gdf.to_crs(target_crs)
        hazard_proj = hazard_gdf.to_crs(target_crs)
        
        _cancel_if_requested(cancel_event)

        # Validate geometries
        logger.info("Validating geometries...")
        
        # Check for invalid geometries first
        invalid_elements = ~element_proj.geometry.is_valid
        invalid_hazards = ~hazard_proj.geometry.is_valid
        
        logger.info(f"Found {invalid_elements.sum()} invalid element geometries")
        logger.info(f"Found {invalid_hazards.sum()} invalid hazard geometries")
        
        # Only fix invalid geometries to avoid unnecessary processing
        if invalid_elements.any():
            logger.info("Fixing invalid element geometries...")
            element_proj.loc[invalid_elements, 'geometry'] = element_proj.loc[invalid_elements, 'geometry'].apply(
                lambda geom: geom.buffer(0)
            )
        
        if invalid_hazards.any():
            logger.info("Fixing invalid hazard geometries...")
            hazard_proj.loc[invalid_hazards, 'geometry'] = hazard_proj.loc[invalid_hazards, 'geometry'].apply(
                lambda geom: geom.buffer(0)
            )
        
        logger.info("Geometry validation complete")
        
        _cancel_if_requested(cancel_event)

        # Check geometry type distribution
        geom_type_counts = element_proj.geometry.type.value_counts()
        logger.info(f"Geometry type distribution: {geom_type_counts.to_dict()}")
        
        # Determine if dataset is primarily linear, polygon, or point
        linear_count = geom_type_counts.get('LineString', 0) + geom_type_counts.get('MultiLineString', 0)
        polygon_count = geom_type_counts.get('Polygon', 0) + geom_type_counts.get('MultiPolygon', 0)
        point_count = geom_type_counts.get('Point', 0) + geom_type_counts.get('MultiPoint', 0)
        
        # Prioritize: Points > Linear > Polygon
        is_point = point_count > max(linear_count, polygon_count)
        is_linear = not is_point and linear_count > polygon_count
        is_polygon = not is_point and not is_linear
        
        geom_type_str = 'Point' if is_point else ('Linear' if is_linear else 'Polygon')
        logger.info(f"Dataset type: {geom_type_str} (point={point_count}, linear={linear_count}, polygon={polygon_count})")
        
        # Filter to single geometry type
        if is_point:
            element_proj = element_proj[element_proj.geometry.type.isin(['Point', 'MultiPoint'])]
            logger.info(f"Filtered to {len(element_proj)} point features")
        elif is_linear:
            element_proj = element_proj[element_proj.geometry.type.isin(['LineString', 'MultiLineString'])]
            logger.info(f"Filtered to {len(element_proj)} linear features")
        else:
            element_proj = element_proj[element_proj.geometry.type.isin(['Polygon', 'MultiPolygon'])]
            logger.info(f"Filtered to {len(element_proj)} polygon features")
        
        # Hazard must be polygons
        hazard_proj = hazard_proj[hazard_proj.geometry.type.isin(['Polygon', 'MultiPolygon'])]
        
        # Skip simplification for now to avoid performance issues
        logger.info("Skipping geometry simplification to improve performance")
        
        # Remove empty geometries
        element_proj = element_proj[~element_proj.geometry.is_empty]
        hazard_proj = hazard_proj[~hazard_proj.geometry.is_empty]
        
        logger.info(f"After simplification: {len(element_proj)} element features, {len(hazard_proj)} hazard features")
        
        _cancel_if_requested(cancel_event)

        if len(element_proj) == 0:
            logger.warning("No valid element geometries after processing!")
            return {
                'name': element_name,
                'exposedFeatures': 0,
                'totalSurfaceArea': "0.00",
                'affectedArea': "0.00",
                'unaffectedArea': "0.00",
                'totalFeatures': len(element_gdf),
                'affectedGeometries': [],
                'measureType': 'area' if not is_linear else 'length',
                'unit': 'km²' if not is_linear else 'km',
                'landuseBreakdown': None,
                'hazardLevelBreakdown': None,
                'elementType': element_type
            }
        
        # Calculate total measure based on geometry type
        if is_point:
            total_count = len(element_proj)
            logger.info(f"Total points: {total_count}")
            
            measure_type = 'count'
            total_measure = total_count
            unit = 'points'
        elif is_linear:
            element_proj['length_m'] = element_proj.geometry.length
            total_length_m = element_proj['length_m'].sum()
            total_length_km = total_length_m / 1000
            logger.info(f"Total length: {total_length_km:.2f} km")
            
            measure_type = 'length'
            total_measure = total_length_km
            unit = 'km'
        else:
            element_proj['area_sqm'] = element_proj.geometry.area
            total_area_sqm = element_proj['area_sqm'].sum()
            total_area_sqkm = total_area_sqm / 1_000_000
            logger.info(f"Total area: {total_area_sqkm:.2f} km²")
            
            measure_type = 'area'
            total_measure = total_area_sqkm
            unit = 'km²'
        
        # Validate total measure
        if total_measure <= 0:
            logger.warning(f"Total {measure_type} is zero or negative: {total_measure}")
            return {
                'name': element_name,
                'exposedFeatures': 0,
                'totalSurfaceArea': f"{total_measure:.2f}" if measure_type != 'count' else str(int(total_measure)),
                'affectedArea': "0.00" if measure_type != 'count' else "0",
                'unaffectedArea': f"{total_measure:.2f}" if measure_type != 'count' else str(int(total_measure)),
                'totalFeatures': len(element_gdf),
                'affectedGeometries': [],
                'measureType': measure_type,
                'unit': unit,
                'landuseBreakdown': None,
                'hazardLevelBreakdown': None,
                'elementType': element_type
            }
        
        _cancel_if_requested(cancel_event)

        logger.info("Calculating intersections...")
        logger.info(f"Processing {len(element_proj)} element features against {len(hazard_proj)} hazard features")
        
        intersection_gdf = None
        affected_measure = 0
        affected_features = set()
        affected_geometries = []
        
        try:
            if is_point:
                logger.info("Using optimized spatial join for point-polygon intersection...")
                
                # Use spatial join for better performance
                logger.info("Performing spatial join...")
                _cancel_if_requested(cancel_event)
                joined = gpd.sjoin(element_proj, hazard_proj, how='inner', predicate='within')
                
                if len(joined) > 0:
                    logger.info(f"Found {len(joined)} point-polygon intersections")
                    
                    intersection_data = []
                    
                    for j, (idx, row) in enumerate(joined.iterrows()):
                        if j > 0 and j % 500 == 0:
                            _cancel_if_requested(cancel_event)
                        # Get hazard level (Var) from hazard properties
                        hazard_var = row.get('Var', 0)
                        
                        # Get original element properties (excluding the joined hazard properties)
                        element_props = {k: v for k, v in row.items() 
                                       if k not in ['index_right', 'Var'] and not k.startswith('geometry')}
                        
                        intersection_data.append({
                            'original_index': idx,
                            'geometry': row.geometry,
                            'intersection_measure': 1,  # Each point counts as 1
                            'hazard_var': hazard_var,
                            **element_props
                        })
                        
                        affected_features.add(idx)
                    
                    logger.info(f"Processed {len(intersection_data)} affected points")
                else:
                    logger.info("No point-polygon intersections found")
                    intersection_data = []
                
                # Create GeoDataFrame from intersection results
                if intersection_data:
                    intersection_gdf = gpd.GeoDataFrame(
                        intersection_data, 
                        crs=target_crs,
                        geometry='geometry'
                    )
                    
                    # Calculate total affected points
                    affected_measure = len(intersection_gdf)
                    
                    logger.info(f"Found {len(intersection_gdf)} affected points")
                else:
                    logger.info("No intersections found")
                    affected_measure = 0
                    affected_features = set()
                    
            elif is_linear:
                logger.info("Using line-polygon intersection method...")
                
                _cancel_if_requested(cancel_event)
                # Create union of all hazard polygons for efficient intersection
                hazard_union = hazard_proj.geometry.unary_union
                logger.info("Created hazard union for intersection")
                
                # Track hazard levels during intersection
                intersection_data = []
                
                for j, (idx, row) in enumerate(element_proj.iterrows()):
                    if j > 0 and j % 40 == 0:
                        _cancel_if_requested(cancel_event)
                    line_geom = row.geometry
                    
                    # Check if line intersects hazard zone
                    if line_geom.intersects(hazard_union):
                        # For each hazard polygon, track which hazard level it represents
                        for haz_idx, haz_row in hazard_proj.iterrows():
                            if line_geom.intersects(haz_row.geometry):
                                intersection = line_geom.intersection(haz_row.geometry)
                                
                                if not intersection.is_empty:
                                    # Handle both LineString and MultiLineString results
                                    if intersection.geom_type == 'LineString':
                                        intersection_length = intersection.length
                                    elif intersection.geom_type == 'MultiLineString':
                                        intersection_length = sum(line.length for line in intersection.geoms)
                                    elif intersection.geom_type == 'GeometryCollection':
                                        intersection_length = sum(
                                            geom.length for geom in intersection.geoms 
                                            if geom.geom_type in ['LineString', 'MultiLineString']
                                        )
                                    else:
                                        logger.warning(f"Unexpected geometry type from intersection: {intersection.geom_type}")
                                        continue
                                    
                                    # Store result in km
                                    intersection_length_km = intersection_length / 1000
                                    
                                    # Store hazard level (Var) from hazard properties
                                    hazard_var = haz_row.get('Var', 0)
                                    
                                    intersection_data.append({
                                        'original_index': idx,
                                        'geometry': intersection,
                                        'intersection_measure': intersection_length_km,
                                        'hazard_var': hazard_var,
                                        **row.drop('geometry').to_dict()
                                    })
                                    
                                    affected_features.add(idx)
                
                # Create GeoDataFrame from intersection results
                if intersection_data:
                    intersection_gdf = gpd.GeoDataFrame(
                        intersection_data, 
                        crs=target_crs,
                        geometry='geometry'
                    )
                    
                    # Calculate total affected length
                    affected_measure = intersection_gdf['intersection_measure'].sum()
                    
                    logger.info(f"Found {len(intersection_gdf)} affected line segments")
                    logger.info(f"Affected length: {affected_measure:.2f} km")
                else:
                    logger.info("No intersections found")
                    affected_measure = 0
                    affected_features = set()
                
            else:
                logger.info("Using ultra-fast intersection method...")
                
                _cancel_if_requested(cancel_event)
                # Create a union of all hazard polygons for faster intersection
                logger.info("Creating hazard union...")
                hazard_union = hazard_proj.geometry.unary_union
                
                # Use spatial join to quickly identify intersecting elements
                logger.info("Finding intersecting elements...")
                _cancel_if_requested(cancel_event)
                intersecting_elements = gpd.sjoin(element_proj, hazard_proj, how='inner', predicate='intersects')
                
                if len(intersecting_elements) == 0:
                    logger.info("No intersections found")
                    intersection_gdf = gpd.GeoDataFrame(columns=element_proj.columns.tolist() + ['Var'])
                else:
                    logger.info(f"Found {len(intersecting_elements)} intersecting elements")
                    
                    # Calculate precise intersections with progress tracking
                    intersection_data = []
                    total_elements = len(intersecting_elements)
                    
                    # Group by hazard to process more efficiently
                    hazard_groups = intersecting_elements.groupby('index_right')
                    
                    for hazard_idx, group in hazard_groups:
                        _cancel_if_requested(cancel_event)
                        hazard_geom = hazard_proj.loc[hazard_idx, 'geometry']
                        hazard_var = hazard_proj.loc[hazard_idx, 'Var'] if 'Var' in hazard_proj.columns else 0
                        
                        logger.info(f"Processing {len(group)} elements for hazard {hazard_idx}")
                        
                        # Process elements in this hazard group
                        for i, (idx, row) in enumerate(group.iterrows()):
                            if i % 50 == 0:  # Progress every 50 elements
                                _cancel_if_requested(cancel_event)
                                logger.info(f"  Progress: {i}/{len(group)} elements")
                            
                            try:
                                element_geom = row.geometry
                                
                                # Calculate precise intersection
                                intersection_geom = element_geom.intersection(hazard_geom)
                                
                                if not intersection_geom.is_empty and hasattr(intersection_geom, 'area') and intersection_geom.area > 0:
                                    intersection_area_km2 = intersection_geom.area / 1_000_000
                                    
                                    # Create intersection record
                                    intersection_record = row.drop(['index_right']).to_dict()
                                    intersection_record['geometry'] = intersection_geom
                                    intersection_record['Var'] = hazard_var
                                    intersection_record['intersection_measure'] = intersection_area_km2
                                    # Preserve element row index for per-boundary stats
                                    intersection_record['element_index'] = idx
                                    
                                    intersection_data.append(intersection_record)
                                    
                            except Exception as e:
                                logger.warning(f"Failed to process intersection for element {idx}: {e}")
                                continue
                        
                        logger.info(f"Completed hazard {hazard_idx}: {len([x for x in intersection_data if x.get('Var') == hazard_var])} intersections")
                    
                    if intersection_data:
                        intersection_gdf = gpd.GeoDataFrame(intersection_data, crs=target_crs)
                        logger.info(f"Created {len(intersection_gdf)} intersection features")
                    else:
                        intersection_gdf = gpd.GeoDataFrame(columns=element_proj.columns.tolist() + ['Var'])
                
                if len(intersection_gdf) == 0:
                    logger.info("No intersections found")
                    affected_measure = 0
                    affected_features = set()
                else:
                    # Calculate affected area
                    intersection_gdf['intersection_measure'] = intersection_gdf.geometry.area / 1_000_000
                    
                    # Store hazard_var for consistency with linear features
                    if 'Var' in intersection_gdf.columns:
                        intersection_gdf['hazard_var'] = intersection_gdf['Var']
                    else:
                        intersection_gdf['hazard_var'] = 0
                    
                    affected_measure = intersection_gdf['intersection_measure'].sum()
                    if 'element_index' in intersection_gdf.columns:
                        affected_features = set(
                            intersection_gdf['element_index'].dropna().unique()
                        )
                    else:
                        affected_features = set(intersection_gdf.index.unique())
                    
                    logger.info(f"Found {len(intersection_gdf)} intersection features")
                    logger.info(f"Affected area: {affected_measure:.2f} km²")
            
            # Generate affected geometries for visualization (optimized batch processing)
            if not skip_visualization and intersection_gdf is not None and len(intersection_gdf) > 0:
                logger.info("Generating affected geometries for visualization...")
                _cancel_if_requested(cancel_event)
                
                try:
                    import time
                    start_time = time.time()
                    
                    # Use all geometries but with optimized processing
                    viz_gdf = intersection_gdf.copy()
                    logger.info(f"Processing {len(viz_gdf)} geometries for visualization")
                    
                    # Apply buffering for linear features in batch
                    if is_linear:
                        logger.info("Applying buffer to linear features...")
                        viz_gdf['geometry'] = viz_gdf.geometry.buffer(5)
                    
                    # Transform all geometries to WGS84 in one operation
                    logger.info("Transforming coordinates to WGS84...")
                    transform_start = time.time()
                    viz_gdf_wgs84 = viz_gdf.to_crs('EPSG:4326')
                    transform_time = time.time() - transform_start
                    logger.info(f"Coordinate transformation took {transform_time:.2f} seconds")
                    
                    # Convert to GeoJSON in batch
                    logger.info("Converting to GeoJSON...")
                    json_start = time.time()
                    geojson_data = json.loads(viz_gdf_wgs84.to_json())
                    json_time = time.time() - json_start
                    logger.info(f"GeoJSON conversion took {json_time:.2f} seconds")
                    
                    # Process features
                    logger.info("Processing feature properties...")
                    for i, feature in enumerate(geojson_data['features']):
                        if i > 0 and i % 150 == 0:
                            _cancel_if_requested(cancel_event)
                        try:
                            row = viz_gdf.iloc[i]
                            affected_geometries.append({
                                'type': 'Feature',
                                'geometry': feature['geometry'],
                                'properties': {
                                    'elementName': element_name,
                                    f'{measure_type}_{unit}': round(row['intersection_measure'], 4) if measure_type != 'count' else 1,
                                    'elementIndex': int(row.get('original_index', i)),
                                    'geometryType': 'point' if is_point else ('linear' if is_linear else 'polygon')
                                }
                            })
                        except Exception as geom_error:
                            logger.warning(f"Failed to process geometry {i}: {geom_error}")
                            continue
                    
                    total_time = time.time() - start_time
                    logger.info(f"Generated {len(affected_geometries)} affected geometry features in {total_time:.2f} seconds")
                    
                except Exception as viz_error:
                    logger.warning(f"Error generating visualization geometries: {viz_error}")
                    affected_geometries = []
            elif skip_visualization:
                logger.info("Skipping visualization geometry generation for faster results")
        
        except Exception as e:
            logger.error(f"Error during intersection calculation: {e}")
            intersection_gdf = None
            affected_measure = 0
            affected_features = set()
            affected_geometries = []
        
        # Validate affected_measure doesn't exceed total_measure (floating-point precision)
        if affected_measure > total_measure:
            logger.warning(f"Affected measure ({affected_measure}) exceeds total measure ({total_measure}). Capping to total.")
            affected_measure = total_measure
        
        # Calculate percentage
        if total_measure > 0:
            percentage_affected = (affected_measure / total_measure) * 100
        else:
            percentage_affected = 0.00
        
        formatted_measure = f"{total_measure:.2f}" if measure_type != 'count' else str(int(total_measure))
        logger.info(f"Total {measure_type}: {formatted_measure} {unit}")
        logger.info(f"Overall exposure: {percentage_affected:.2f}%")
        
        unaffected_measure = max(0.0, total_measure - affected_measure)

        result = {
            'name': element_name,
            'exposedFeatures': len(affected_features),
            'totalSurfaceArea': f"{total_measure:.2f}" if measure_type != 'count' else str(int(total_measure)),
            'affectedArea': f"{affected_measure:.2f}" if measure_type != 'count' else str(int(affected_measure)),
            'unaffectedArea': f"{unaffected_measure:.2f}" if measure_type != 'count' else str(int(unaffected_measure)),
            'totalFeatures': len(element_gdf),
            'affectedGeometries': affected_geometries,
            'measureType': measure_type,
            'unit': unit,
            'landuseBreakdown': None,
            'hazardLevelBreakdown': None,
            'elementType': element_type
        }
        
        # Generate hazard level breakdown for flood data
        is_flood_hazard = hazard_type and 'flood' in hazard_type.lower()
        
        if is_flood_hazard and intersection_gdf is not None and len(intersection_gdf) > 0 and 'hazard_var' in intersection_gdf.columns:
            try:
                _cancel_if_requested(cancel_event)
                logger.info("Generating hazard level breakdown for flood data...")
                
                # Map Var values to hazard levels
                def get_hazard_level(var_value):
                    try:
                        var = int(var_value)
                        if var == 1:
                            return "Low (0-0.5m)"
                        elif var == 2:
                            return "Medium (0.5-1.5m)"
                        elif var == 3:
                            return "High (>1.5m)"
                        else:
                            return "Unknown"
                    except:
                        return "Unknown"
                
                intersection_gdf['hazard_level'] = intersection_gdf['hazard_var'].apply(get_hazard_level)
                
                # Group by hazard level and sum the intersection measures
                level_breakdown = intersection_gdf.groupby('hazard_level')['intersection_measure'].sum()
                
                breakdown_data = []
                
                # Define the order of hazard levels for consistent display
                level_order = ["High (>1.5m)", "Medium (0.5-1.5m)", "Low (0-0.5m)"]
                
                for level in level_order:
                    if level in level_breakdown.index:
                        measure_value = level_breakdown[level]
                        
                        # Calculate percentage of affected area for this hazard level
                        if affected_measure > 0:
                            percentage = round((measure_value / affected_measure) * 100, 2)
                        else:
                            percentage = 0.0
                        
                        breakdown_data.append({
                            'hazardLevel': level,
                            'measure': round(measure_value, 2) if measure_type != 'count' else int(measure_value),
                            'percentage': percentage,
                            'unit': unit
                        })
                
                # Only include breakdown if we have data
                if breakdown_data:
                    result['hazardLevelBreakdown'] = breakdown_data
                    logger.info(f"✓ Generated hazard level breakdown with {len(breakdown_data)} levels")
                else:
                    result['hazardLevelBreakdown'] = None
                    
            except Exception as e:
                logger.warning(f"Could not generate hazard level breakdown: {e}")
                result['hazardLevelBreakdown'] = None
        
        # Generate landuse breakdown (only for polygon land cover data, not for points)
        is_land_cover = False
        is_transportation = False
        
        if is_point:
            # Points represent discrete facilities/assets, not land cover
            is_land_cover = False
            is_transportation = False
            logger.info("Dataset identified as Point features (discrete assets)")
        elif is_linear:
            is_transportation = True
            is_land_cover = False
            logger.info("Dataset identified as Transportation Networks (linear features)")
        else:
            if element_type:
                is_land_cover = "Land Cover" in element_type or "land cover" in element_type.lower()
                is_transportation = "Transportation" in element_type or "transport" in element_type.lower()
            else:
                is_land_cover = any(keyword in element_name.lower() for keyword in [
                    'land cover', 'landcover', 'land use', 'landuse', 'lc_', 'esri'
                ])
                is_transportation = any(keyword in element_name.lower() for keyword in [
                    'transport', 'road', 'highway', 'railway', 'network'
                ])
        
        if is_land_cover and not is_transportation and intersection_gdf is not None and len(intersection_gdf) > 0:
            potential_class_cols = ['landuse', 'class', 'type', 'landcover', 'lc_class', 
                                   'LC_TYPE', 'CLASS_NAME', 'land_use', 'LANDUSE']
            landuse_col = None
            
            for col in potential_class_cols:
                if col in element_proj.columns:
                    landuse_col = col
                    logger.info(f"Found landuse column: {landuse_col}")
                    break
            
            if landuse_col:
                try:
                    _cancel_if_requested(cancel_event)
                    logger.info("Generating landuse breakdown...")
                    
                    measure_col = 'area_sqm'
                    measure_unit = 'km²'
                    measure_divisor = 1_000_000
                    
                    # Group by landuse to get totals
                    landuse_total = element_proj.groupby(landuse_col)[measure_col].sum() / measure_divisor
                    
                    if landuse_col not in intersection_gdf.columns:
                        logger.warning(f"Landuse column '{landuse_col}' not found in intersection result")
                        result['landuseBreakdown'] = None
                    else:
                        # Group intersection measures by landuse
                        affected_by_landuse = intersection_gdf.groupby(landuse_col)['intersection_measure'].sum()
                        
                        breakdown_data = []
                        
                        for lu_i, landuse_type in enumerate(landuse_total.index):
                            if lu_i > 0 and lu_i % 25 == 0:
                                _cancel_if_requested(cancel_event)
                            total_measure_val = landuse_total[landuse_type]
                            affected_measure_val = affected_by_landuse.get(landuse_type, 0.0)
                            unaffected_measure_val = max(0.0, round(total_measure_val - affected_measure_val, 6))
                            
                            # Round values for display
                            total_rounded = round(total_measure_val, 2)
                            affected_rounded = round(affected_measure_val, 2)
                            unaffected_rounded = round(unaffected_measure_val, 2)
                            
                            # Calculate percentage - if rounded total is 0, percentage is 0
                            # This prevents showing 100% when both total and affected round to 0.00
                            if total_rounded > 0:
                                percentage = round((affected_measure_val / total_measure_val * 100), 2)
                            else:
                                percentage = 0.0
                            
                            breakdown_data.append({
                                'landuse': str(landuse_type),
                                'total_area_km2': total_rounded,
                                'affected_area_km2': affected_rounded,
                                'unaffected_area_km2': unaffected_rounded,
                                'percentage_affected': percentage,
                                'measure_unit': measure_unit
                            })
                        
                        breakdown_data.sort(key=lambda x: x['percentage_affected'], reverse=True)
                        result['landuseBreakdown'] = breakdown_data
                        logger.info(f"✓ Generated landuse breakdown with {len(breakdown_data)} categories")
                
                except Exception as e:
                    logger.warning(f"Could not generate landuse breakdown: {e}")
                    result['landuseBreakdown'] = None
        
        # Per administrative unit (geoBoundaries: shapeName) — polygon area exposure only
        if (
            is_polygon
            and measure_type == 'area'
            and intersection_gdf is not None
            and len(intersection_gdf) > 0
            and 'shapeName' in element_proj.columns
            and 'element_index' in intersection_gdf.columns
        ):
            try:
                _cancel_if_requested(cancel_event)
                per_el = intersection_gdf.groupby('element_index')[
                    'intersection_measure'
                ].sum()
                rows = []
                for el_idx, aff_km2 in per_el.items():
                    if el_idx not in element_proj.index:
                        continue
                    try:
                        total_km2 = float(
                            element_proj.loc[el_idx, 'area_sqm']
                        ) / 1_000_000
                    except Exception:
                        continue
                    aff_f = float(aff_km2)
                    if aff_f <= 0 or total_km2 <= 0:
                        continue
                    pct = round((aff_f / total_km2) * 100, 2)
                    row_el = element_proj.loc[el_idx]
                    bname = row_el.get('shapeName')
                    if bname is None or pd.isna(bname):
                        bname = f"Unit {el_idx}"
                    else:
                        bname = str(bname).strip() or f"Unit {el_idx}"
                    bid = row_el.get('shapeID')
                    if bid is None or pd.isna(bid):
                        bid = None
                    else:
                        bid = str(bid).strip() or None
                    rows.append({
                        'boundaryName': bname,
                        'boundaryId': bid,
                        'totalAreaKm2': round(total_km2, 2),
                        'affectedAreaKm2': round(aff_f, 2),
                        'percentAffected': pct,
                        'unit': 'km²',
                    })
                rows.sort(key=lambda x: x['percentAffected'], reverse=True)
                result['featureExposureBreakdown'] = rows
                logger.info(
                    f"✓ Per-boundary exposure breakdown: {len(rows)} unit(s)"
                )
            except Exception as e:
                logger.warning(
                    f"Could not generate per-boundary breakdown: {e}"
                )
                result['featureExposureBreakdown'] = None
        
        logger.info(f"✓ Analysis complete for {element_name}")
        return result
        
    except ExposureAnalysisCancelled:
        logger.info(f"Analysis cancelled for {element_name} (client disconnect)")
        raise
    except Exception as e:
        logger.error(f"Error analyzing {element_name}: {str(e)}", exc_info=True)
        raise


async def run_exposure_assessment(http_request: Request, request: ExposureAssessmentRequest):
    """
    Run exposure assessment analysis.
    Heavy work runs in a thread pool so the event loop can detect client disconnect
    and set a cancel flag; analyze_exposure checks the flag at safe points to save compute.

    element_data may be OSM exposure layers or administrative boundary GeoJSON
    (Polygon/MultiPolygon) from /api/boundaries — same analysis path as land-cover polygons.
    """
    cancelled = threading.Event()

    async def watch_disconnect():
        try:
            while True:
                if await http_request.is_disconnected():
                    logger.info(
                        "Exposure assessment: client disconnected — cancelling analysis"
                    )
                    cancelled.set()
                    return
                await asyncio.sleep(0.2)
        except asyncio.CancelledError:
            cancelled.set()
            raise

    watcher = asyncio.create_task(watch_disconnect())
    try:
        logger.info("Received exposure assessment request")
        logger.info(f"Hazard type: {request.hazard_type}")
        logger.info(f"Analysis area: {request.analysis_area}")
        logger.info(f"Element type: {request.element_type}")

        # Convert Pydantic models to dicts
        hazard_geojson = request.hazard_data.dict()
        element_geojson = request.element_data.dict()

        # Validate features
        if not hazard_geojson.get("features") or len(hazard_geojson["features"]) == 0:
            raise HTTPException(
                status_code=400, detail="Hazard data contains no features"
            )

        if not element_geojson.get("features") or len(element_geojson["features"]) == 0:
            raise HTTPException(
                status_code=400, detail="Element data contains no features"
            )

        logger.info(f"Processing {len(hazard_geojson['features'])} hazard features")
        logger.info(f"Processing {len(element_geojson['features'])} element features")

        # Thread + disconnect watcher: stops burning CPU when user closes/aborts the request
        _run_analysis = partial(
            analyze_exposure,
            hazard_geojson,
            element_geojson,
            request.analysis_area,
            request.element_type,
            request.hazard_type,
            False,
            cancelled,
        )
        if hasattr(asyncio, "to_thread"):
            result = await asyncio.to_thread(_run_analysis)
        else:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _run_analysis)

        # Format response
        response = ExposureAssessmentResponse(
            hazardType=request.hazard_type,
            analysisArea=request.analysis_area,
            scope="Current map view",
            analysisTime=datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p"),
            elements=[
                ElementResult(
                    name=result["name"],
                    exposedFeatures=result["exposedFeatures"],
                    totalSurfaceArea=result["totalSurfaceArea"],
                    affectedArea=result["affectedArea"],
                    unaffectedArea=result["unaffectedArea"],
                    totalFeatures=result["totalFeatures"],
                    landuseBreakdown=result.get("landuseBreakdown"),
                    hazardLevelBreakdown=result.get("hazardLevelBreakdown"),
                    featureExposureBreakdown=result.get(
                        "featureExposureBreakdown"
                    ),
                )
            ],
            affectedGeometries=result.get("affectedGeometries", []),
            unit=result.get("unit", "km²"),
        )

        logger.info("Analysis completed successfully")
        logger.info(f"Returning {len(response.affectedGeometries)} affected geometries")
        return response

    except ExposureAnalysisCancelled:
        logger.info("Exposure assessment cancelled (client disconnected)")
        raise HTTPException(
            status_code=499,
            detail="Analysis cancelled — client disconnected",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in exposure assessment: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error performing exposure assessment: {str(e)}",
        )
    finally:
        watcher.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await watcher


def cleanup():
    """Cleanup process pool on shutdown"""
    process_pool.shutdown(wait=True)
    logger.info("Exposure assessment process pool shut down")