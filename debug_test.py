#!/usr/bin/env python3
"""
Debug test for Baby Day Book API - investigate data persistence issues
"""

import requests
import json
from datetime import datetime, timezone

BACKEND_URL = "https://babycare-tracker.preview.emergentagent.com/api"
SESSION_TOKEN = "test_session_1768384525697"

def make_request(method, endpoint, data=None):
    url = f"{BACKEND_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    }
    
    if method == "POST":
        response = requests.post(url, json=data, headers=headers)
    elif method == "GET":
        response = requests.get(url, headers=headers)
    
    print(f"{method} {endpoint}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print("-" * 50)
    
    return response

def debug_feeding():
    print("=== DEBUGGING FEEDING ENDPOINT ===")
    
    # Create feeding with detailed logging
    feeding_data = {
        "baby_id": "baby_598fcbc4e9cb",
        "feeding_type": "bottle",
        "start_time": "2025-01-14T10:00:00Z",
        "amount_ml": 120
    }
    
    response = make_request("POST", "/feeding", feeding_data)
    
    if response.status_code == 200:
        feeding_result = response.json()
        print(f"Created feeding ID: {feeding_result.get('feeding_id')}")
        
        # Immediately try to get it back
        response = make_request("GET", f"/feeding/baby_598fcbc4e9cb")
        if response.status_code == 200:
            feedings = response.json()
            print(f"Retrieved {len(feedings)} feeding records")
            for f in feedings:
                print(f"  - {f.get('feeding_id')}: {f.get('feeding_type')} at {f.get('start_time')}")

def debug_sleep():
    print("=== DEBUGGING SLEEP ENDPOINT ===")
    
    sleep_data = {
        "baby_id": "baby_598fcbc4e9cb",
        "sleep_type": "nap",
        "start_time": "2025-01-14T09:00:00Z",
        "end_time": "2025-01-14T10:00:00Z",
        "duration_minutes": 60
    }
    
    response = make_request("POST", "/sleep", sleep_data)
    
    if response.status_code == 200:
        sleep_result = response.json()
        print(f"Created sleep ID: {sleep_result.get('sleep_id')}")
        
        # Immediately try to get it back
        response = make_request("GET", f"/sleep/baby_598fcbc4e9cb")
        if response.status_code == 200:
            sleeps = response.json()
            print(f"Retrieved {len(sleeps)} sleep records")
            for s in sleeps:
                print(f"  - {s.get('sleep_id')}: {s.get('sleep_type')} at {s.get('start_time')}")

def debug_diaper():
    print("=== DEBUGGING DIAPER ENDPOINT ===")
    
    diaper_data = {
        "baby_id": "baby_598fcbc4e9cb",
        "diaper_type": "wet",
        "time": "2025-01-14T10:30:00Z"
    }
    
    response = make_request("POST", "/diaper", diaper_data)
    
    if response.status_code == 200:
        diaper_result = response.json()
        print(f"Created diaper ID: {diaper_result.get('diaper_id')}")
        
        # Immediately try to get it back
        response = make_request("GET", f"/diaper/baby_598fcbc4e9cb")
        if response.status_code == 200:
            diapers = response.json()
            print(f"Retrieved {len(diapers)} diaper records")
            for d in diapers:
                print(f"  - {d.get('diaper_id')}: {d.get('diaper_type')} at {d.get('time')}")

if __name__ == "__main__":
    debug_feeding()
    debug_sleep()
    debug_diaper()