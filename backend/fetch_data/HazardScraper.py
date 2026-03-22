# BEFORE: This was part of a standalone FastAPI server
# AFTER: This is now a pure scraper module without FastAPI dependencies

import sys
import asyncio
import threading
import time
import re
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

# Windows-specific event loop policy fix for subprocess support
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd
from playwright.async_api import async_playwright

# Philippine Standard Time (same offset as PHT; site labels it PST)
MANILA_TZ = ZoneInfo("Asia/Manila")

# Global variable to store the latest scraped data
latest_data: List[Dict] = []
latest_tsunami_data: List[Dict] = []

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


def _parse_tsunami_datetime(s: str) -> Optional[datetime]:
    """Parse PHIVOLCS tsunami table date, e.g. '05 Mar 2026 - 01:55 AM'."""
    s = re.sub(r"\s+", " ", (s or "").strip())
    for fmt in ("%d %b %Y - %I:%M %p", "%d %B %Y - %I:%M %p"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=MANILA_TZ)
        except ValueError:
            continue
    return None


def _parse_coord_cell(s: str) -> Optional[float]:
    """Parse '52.00°N', '176.10°E', etc."""
    s = re.sub(r"\s+", " ", (s or "").strip())
    m = re.search(r"([\d.]+)\s*°\s*([NSEW])", s, re.I)
    if not m:
        m = re.search(r"([\d.]+)\s*([NSEW])\b", s, re.I)
    if not m:
        return None
    v = float(m.group(1))
    hemi = m.group(2).upper()
    if hemi in ("S", "W"):
        v = -v
    return v


def _tsunami_rows_for_terminal_table(rows: List[Dict]) -> List[Dict]:
    """Column names aligned with the PHIVOLCS tsunami site; same keys as earthquake log style."""
    out: List[Dict] = []
    for r in rows:
        out.append(
            {
                "Date and Time(PST)": (r.get("Date and Time (PST)") or "").strip(),
                "Latitude": (r.get("Latitude") or "").strip(),
                "Longitude": (r.get("Longitude") or "").strip(),
                "Depth": str(r.get("Depth (km)") or "").strip(),
                "Magnitude": str(r.get("Magnitude") or "").strip(),
                "Location": (r.get("Location") or "").replace("\n", " ").strip(),
                "Advisory": (r.get("Advisory") or "").replace("\n", " ").strip(),
                "Advisory URL": (r.get("Advisory URL") or "").strip(),
            }
        )
    return out


async def scrape_latest_tsunami_async() -> List[Dict]:
    """
    Scrape tsunami-related earthquake events from PHIVOLCS tsunami information site.
    Keeps rows from the past 60 days in Philippine Standard Time.
    """
    results: List[Dict] = []
    cutoff = datetime.now(MANILA_TZ) - timedelta(days=60)
    base_url = "https://tsunami.phivolcs.dost.gov.ph/"

    print("\nFetching PHIVOLCS tsunami table...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-logging",
            ],
        )
        page = await browser.new_page()
        try:
            await page.goto(
                base_url,
                timeout=90000,
                wait_until="domcontentloaded",
            )
            await page.wait_for_timeout(5000)
            await page.wait_for_selector("table tr", timeout=60000)
            rows = await page.query_selector_all("table tr")

            for row in rows:
                cols = await row.query_selector_all("td")
                if len(cols) < 6:
                    continue
                texts = []
                for c in cols:
                    texts.append((await c.inner_text()).strip())

                raw_date = texts[0]
                if not raw_date:
                    continue
                # Data rows start with day-of-month; skip header / filler rows
                if not re.match(r"^\d{1,2}\s", raw_date):
                    continue

                dt = _parse_tsunami_datetime(raw_date)
                if dt is None or dt < cutoff:
                    continue

                lat = _parse_coord_cell(texts[1])
                lon = _parse_coord_cell(texts[2])
                if lat is None or lon is None:
                    continue

                depth = texts[3] if len(texts) > 3 else ""
                mag = texts[4] if len(texts) > 4 else ""
                loc = texts[5] if len(texts) > 5 else ""
                advisory_text = texts[6] if len(texts) > 6 else ""
                advisory_url = ""
                if len(cols) > 6:
                    link = await cols[6].query_selector("a")
                    if link:
                        href = await link.get_attribute("href")
                        if href:
                            advisory_url = urljoin(base_url, href.strip())

                results.append(
                    {
                        "Date and Time (PST)": raw_date,
                        "Latitude": texts[1],
                        "Longitude": texts[2],
                        "Depth (km)": depth,
                        "Magnitude": mag,
                        "Location": loc,
                        "Advisory": advisory_text,
                        "Advisory URL": advisory_url,
                    }
                )
        finally:
            await browser.close()

    if results:
        print(
            f"\n=== Tsunami bulletin events (past 60 days PHST): {len(results)} "
            f"({datetime.now(MANILA_TZ).strftime('%H:%M:%S')}) ==="
        )
        # Same terminal style as earthquake table (pandas, no ASCII box borders)
        df_tsu = pd.DataFrame(_tsunami_rows_for_terminal_table(results))
        col_order = [
            "Date and Time(PST)",
            "Latitude",
            "Longitude",
            "Depth",
            "Magnitude",
            "Location",
            "Advisory",
            "Advisory URL",
        ]
        df_tsu = df_tsu[col_order]
        print(df_tsu.to_string(index=False))
    else:
        print(
            f"\nNo tsunami-table rows in past 60 days "
            f"({datetime.now(MANILA_TZ).strftime('%H:%M:%S')} PH)."
        )

    return results


def scrape_latest_tsunami() -> List[Dict]:
    return asyncio.run(scrape_latest_tsunami_async())


def scraper_loop():
    """Background thread loop that continuously scrapes data every 60 seconds."""
    global latest_data, latest_tsunami_data
    while True:
        try:
            latest_data = scrape_latest_earthquakes()
        except Exception as e:
            print(f"[ERROR] Scraper failed: {e}")

        try:
            latest_tsunami_data = scrape_latest_tsunami()
        except Exception as e:
            print(f"[ERROR] Tsunami scraper failed: {e}")

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


def get_latest_tsunami_data() -> List[Dict]:
    """Get the latest scraped PHIVOLCS tsunami table rows (already 60-day-filtered)."""
    return latest_tsunami_data