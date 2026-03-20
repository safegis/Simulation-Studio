# BEFORE: This was part of a standalone FastAPI server
# AFTER: This is now a pure scraper module without FastAPI dependencies

import sys
import asyncio
import threading
import time

# Windows-specific event loop policy fix for subprocess support
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from datetime import datetime, timedelta
from typing import List, Dict
import pandas as pd
from playwright.async_api import async_playwright

# Global variable to store the latest scraped data
latest_data: List[Dict] = []

async def scrape_latest_earthquakes_async() -> List[Dict]:
    """Async function to scrape earthquake data from PHIVOLCS website."""
    results = []
    cutoff_time = datetime.now() - timedelta(hours=24)

    print("\nFetching data...") 
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True,
                                          args=[
                                              "--no-sandbox",
                                              "--disable-dev-shm-usage",
                                              "--disable-gpu",
                                              "--disable-logging"
                                          ])
        page = await browser.new_page()
        await page.goto("https://earthquake.phivolcs.dost.gov.ph/", timeout=60000)
        
        # Wait for table rows to load
        await page.wait_for_selector("table tr")
        rows = await page.query_selector_all("table tr")
        
        # Skip header row
        for row in rows[1:]:
            cols = await row.query_selector_all("td")
            if len(cols) >= 6:
                date_time_str = (await cols[0].inner_text()).strip()
                try:
                    date_time_obj = datetime.strptime(date_time_str, "%d %B %Y - %I:%M %p")
                except ValueError:
                    continue
                
                if date_time_obj >= cutoff_time:
                    lat = (await cols[1].inner_text()).strip()
                    lon = (await cols[2].inner_text()).strip()
                    depth = (await cols[3].inner_text()).strip()
                    mag = (await cols[4].inner_text()).strip()
                    loc = (await cols[5].inner_text()).strip()
                    
                    results.append({
                        "Date & Time (PHT)": date_time_str,
                        "Latitude (°N)": lat,
                        "Longitude (°E)": lon,
                        "Depth (km)": depth,
                        "Magnitude": mag,
                        "Location": loc
                    })
        await browser.close()

    if results:
        df = pd.DataFrame(results)
        print(f"\n=== Earthquakes in the Past 24 Hours ({datetime.now().strftime('%H:%M:%S')}) ===")
        print(df.to_string(index=False))
    else:
        print(f"\nNo earthquakes found in the past 24 hours ({datetime.now().strftime('%H:%M:%S')}).")

    return results

def scrape_latest_earthquakes() -> List[Dict]:
    """Wrapper function to run async scraper in sync context."""
    return asyncio.run(scrape_latest_earthquakes_async())

def scraper_loop():
    """Background thread loop that continuously scrapes data every 60 seconds."""
    global latest_data
    while True:
        try:
            latest_data = scrape_latest_earthquakes()
        except Exception as e:
            print(f"[ERROR] Scraper failed: {e}")

        print()

        # Countdown before next fetch, from 60 seconds down to 0
        for remaining in range(60, -1, -1):
            mins, secs = divmod(remaining, 60)
            print(f"Next fetch will be in {mins}:{secs:02d}", end="\r", flush=True)
            time.sleep(1)
        print()  # Move to next line after countdown finishes

def start_scraper():
    """Start the scraper in a background thread."""
    thread = threading.Thread(target=scraper_loop, daemon=True)
    thread.start()
    return thread

def get_latest_data() -> List[Dict]:
    """Get the latest scraped earthquake data."""
    return latest_data