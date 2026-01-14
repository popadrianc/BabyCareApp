#!/usr/bin/env python3
"""
Debug timeline and stats endpoints
"""

import requests
import json
from datetime import datetime, timezone

BACKEND_URL = "https://babycare-tracker.preview.emergentagent.com/api"
SESSION_TOKEN = "test_session_1768384525697"
BABY_ID = "baby_598fcbc4e9cb"

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

def test_timeline():
    print("=== TESTING TIMELINE ===")
    
    # Test without date parameter (should use today)
    response = make_request("GET", f"/timeline/{BABY_ID}")
    
    # Test with specific date
    response = make_request("GET", f"/timeline/{BABY_ID}?date=2025-01-14")

def test_stats():
    print("=== TESTING STATS ===")
    
    # Test without date parameter (should use today)
    response = make_request("GET", f"/stats/{BABY_ID}")
    
    # Test with specific date
    response = make_request("GET", f"/stats/{BABY_ID}?date=2025-01-14")

if __name__ == "__main__":
    test_timeline()
    test_stats()