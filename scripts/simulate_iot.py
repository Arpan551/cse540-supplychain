"""
simulate_iot.py
---------------
Generates mock IoT sensor readings (temperature, humidity, GPS) for products
in the supply chain. In the final implementation, these readings will be
submitted on-chain via an oracle. For now, the script prints sample payloads
that mimic what a real IoT device would send.

Usage:
    python scripts/simulate_iot.py

Output:
    JSON-formatted sensor readings printed to stdout, one per second.
"""

import json
import random
import time
from datetime import datetime, timezone


# Products currently being tracked in the simulation
TRACKED_PRODUCTS = [1, 2, 3]

# Geographic bounding box for simulated GPS coordinates (continental US)
GPS_BOUNDS = {
    "lat_min": 25.0,
    "lat_max": 49.0,
    "lon_min": -125.0,
    "lon_max": -66.0,
}


def generate_reading(product_id: int) -> dict:
    """
    Generates a single simulated sensor reading for a given product.
    Fields match what would be submitted to an on-chain oracle.
    """
    return {
        "productId":   product_id,
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "temperature": round(random.uniform(2.0, 30.0), 2),   # Celsius
        "humidity":    round(random.uniform(30.0, 85.0), 2),  # Percent
        "latitude":    round(random.uniform(GPS_BOUNDS["lat_min"], GPS_BOUNDS["lat_max"]), 6),
        "longitude":   round(random.uniform(GPS_BOUNDS["lon_min"], GPS_BOUNDS["lon_max"]), 6),
        "status":      random.choice(["IN_TRANSIT", "AT_WAREHOUSE", "OUT_FOR_DELIVERY"]),
    }


def main():
    print("Starting simulated IoT data feed...")
    print("Press Ctrl+C to stop.\n")

    iteration = 0
    while True:
        iteration += 1
        print(f"--- Reading batch {iteration} ---")
        for product_id in TRACKED_PRODUCTS:
            reading = generate_reading(product_id)
            print(json.dumps(reading, indent=2))
        print()
        time.sleep(3)


if __name__ == "__main__":
    main()
