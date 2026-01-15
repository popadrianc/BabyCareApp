#!/usr/bin/env python3
"""
Baby Day Book Backend API Testing Suite
Tests all backend endpoints with proper authentication
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BACKEND_URL = "https://babytrak.preview.emergentagent.com/api"

class BabyDayBookTester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.baby_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, 
                    headers: Dict[str, str] = None) -> requests.Response:
        """Make authenticated request to API"""
        url = f"{BACKEND_URL}{endpoint}"
        
        # Default headers
        request_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Add auth header if we have a session token
        if self.session_token:
            request_headers["Authorization"] = f"Bearer {self.session_token}"
        
        # Merge with provided headers
        if headers:
            request_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_health_check(self):
        """Test basic health endpoints"""
        try:
            # Test root endpoint
            response = self.make_request("GET", "/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Baby Day Book API" in data["message"]:
                    self.log_test("Root endpoint", True, f"Response: {data}")
                else:
                    self.log_test("Root endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_test("Root endpoint", False, f"Status: {response.status_code}")
            
            # Test health endpoint
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health check", True, f"Status: {data['status']}")
                else:
                    self.log_test("Health check", False, f"Unexpected status: {data}")
            else:
                self.log_test("Health check", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Health endpoints", False, f"Exception: {str(e)}")
    
    def set_session_token(self, token: str):
        """Set session token for authentication"""
        self.session_token = token
        print(f"Session token set: {token[:20]}...")
    
    def test_auth_me(self):
        """Test GET /api/auth/me endpoint"""
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                user_data = response.json()
                if "user_id" in user_data and "email" in user_data:
                    self.user_id = user_data["user_id"]
                    self.log_test("Auth /me endpoint", True, 
                                f"User: {user_data.get('name', 'Unknown')} ({user_data.get('email', 'No email')})")
                else:
                    self.log_test("Auth /me endpoint", False, f"Missing required fields: {user_data}")
            elif response.status_code == 401:
                self.log_test("Auth /me endpoint", False, "Authentication failed - invalid session token")
            else:
                self.log_test("Auth /me endpoint", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Auth /me endpoint", False, f"Exception: {str(e)}")
    
    def test_baby_crud(self):
        """Test baby CRUD operations"""
        try:
            # Create baby
            baby_data = {
                "name": "Emma Rose",
                "birth_date": "2024-06-15",
                "gender": "female"
            }
            
            response = self.make_request("POST", "/baby", baby_data)
            
            if response.status_code == 200:
                baby = response.json()
                if "baby_id" in baby and baby["name"] == baby_data["name"]:
                    self.baby_id = baby["baby_id"]
                    self.log_test("Create baby", True, f"Baby created: {baby['name']} (ID: {self.baby_id})")
                else:
                    self.log_test("Create baby", False, f"Invalid response: {baby}")
            else:
                self.log_test("Create baby", False, f"Status: {response.status_code}, Response: {response.text}")
                return
            
            # Get babies list
            response = self.make_request("GET", "/baby")
            
            if response.status_code == 200:
                babies = response.json()
                if isinstance(babies, list) and len(babies) > 0:
                    found_baby = any(b.get("baby_id") == self.baby_id for b in babies)
                    if found_baby:
                        self.log_test("Get babies list", True, f"Found {len(babies)} babies")
                    else:
                        self.log_test("Get babies list", False, "Created baby not found in list")
                else:
                    self.log_test("Get babies list", False, f"Invalid response: {babies}")
            else:
                self.log_test("Get babies list", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Baby CRUD operations", False, f"Exception: {str(e)}")
    
    def test_feeding_tracking(self):
        """Test feeding record operations"""
        if not self.baby_id:
            self.log_test("Feeding tracking", False, "No baby_id available")
            return
        
        try:
            # Create feeding record
            feeding_data = {
                "baby_id": self.baby_id,
                "feeding_type": "bottle",
                "start_time": "2025-01-14T10:00:00Z",
                "amount_ml": 120
            }
            
            response = self.make_request("POST", "/feeding", feeding_data)
            
            if response.status_code == 200:
                feeding = response.json()
                if "feeding_id" in feeding and feeding["feeding_type"] == "bottle":
                    feeding_id = feeding["feeding_id"]
                    self.log_test("Create feeding record", True, 
                                f"Feeding created: {feeding['feeding_type']}, {feeding.get('amount_ml', 0)}ml")
                else:
                    self.log_test("Create feeding record", False, f"Invalid response: {feeding}")
            else:
                self.log_test("Create feeding record", False, f"Status: {response.status_code}, Response: {response.text}")
                return
            
            # Get feeding records
            response = self.make_request("GET", f"/feeding/{self.baby_id}")
            
            if response.status_code == 200:
                feedings = response.json()
                if isinstance(feedings, list) and len(feedings) > 0:
                    self.log_test("Get feeding records", True, f"Found {len(feedings)} feeding records")
                else:
                    self.log_test("Get feeding records", False, f"No feeding records found: {feedings}")
            else:
                self.log_test("Get feeding records", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Feeding tracking", False, f"Exception: {str(e)}")
    
    def test_sleep_tracking(self):
        """Test sleep record operations"""
        if not self.baby_id:
            self.log_test("Sleep tracking", False, "No baby_id available")
            return
        
        try:
            # Create sleep record
            sleep_data = {
                "baby_id": self.baby_id,
                "sleep_type": "nap",
                "start_time": "2025-01-14T09:00:00Z",
                "end_time": "2025-01-14T10:00:00Z",
                "duration_minutes": 60
            }
            
            response = self.make_request("POST", "/sleep", sleep_data)
            
            if response.status_code == 200:
                sleep = response.json()
                if "sleep_id" in sleep and sleep["sleep_type"] == "nap":
                    self.log_test("Create sleep record", True, 
                                f"Sleep created: {sleep['sleep_type']}, {sleep.get('duration_minutes', 0)} minutes")
                else:
                    self.log_test("Create sleep record", False, f"Invalid response: {sleep}")
            else:
                self.log_test("Create sleep record", False, f"Status: {response.status_code}, Response: {response.text}")
                return
            
            # Get sleep records
            response = self.make_request("GET", f"/sleep/{self.baby_id}")
            
            if response.status_code == 200:
                sleep_records = response.json()
                if isinstance(sleep_records, list) and len(sleep_records) > 0:
                    self.log_test("Get sleep records", True, f"Found {len(sleep_records)} sleep records")
                else:
                    self.log_test("Get sleep records", False, f"No sleep records found: {sleep_records}")
            else:
                self.log_test("Get sleep records", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Sleep tracking", False, f"Exception: {str(e)}")
    
    def test_diaper_tracking(self):
        """Test diaper record operations"""
        if not self.baby_id:
            self.log_test("Diaper tracking", False, "No baby_id available")
            return
        
        try:
            # Create diaper record
            diaper_data = {
                "baby_id": self.baby_id,
                "diaper_type": "wet",
                "time": "2025-01-14T10:30:00Z"
            }
            
            response = self.make_request("POST", "/diaper", diaper_data)
            
            if response.status_code == 200:
                diaper = response.json()
                if "diaper_id" in diaper and diaper["diaper_type"] == "wet":
                    self.log_test("Create diaper record", True, f"Diaper created: {diaper['diaper_type']}")
                else:
                    self.log_test("Create diaper record", False, f"Invalid response: {diaper}")
            else:
                self.log_test("Create diaper record", False, f"Status: {response.status_code}, Response: {response.text}")
                return
            
            # Get diaper records
            response = self.make_request("GET", f"/diaper/{self.baby_id}")
            
            if response.status_code == 200:
                diapers = response.json()
                if isinstance(diapers, list) and len(diapers) > 0:
                    self.log_test("Get diaper records", True, f"Found {len(diapers)} diaper records")
                else:
                    self.log_test("Get diaper records", False, f"No diaper records found: {diapers}")
            else:
                self.log_test("Get diaper records", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Diaper tracking", False, f"Exception: {str(e)}")
    
    def test_growth_tracking(self):
        """Test growth record operations"""
        if not self.baby_id:
            self.log_test("Growth tracking", False, "No baby_id available")
            return
        
        try:
            # Create growth record
            growth_data = {
                "baby_id": self.baby_id,
                "date": "2025-01-14",
                "weight_kg": 5.5,
                "height_cm": 60
            }
            
            response = self.make_request("POST", "/growth", growth_data)
            
            if response.status_code == 200:
                growth = response.json()
                if "growth_id" in growth and growth.get("weight_kg") == 5.5:
                    self.log_test("Create growth record", True, 
                                f"Growth created: {growth.get('weight_kg')}kg, {growth.get('height_cm')}cm")
                else:
                    self.log_test("Create growth record", False, f"Invalid response: {growth}")
            else:
                self.log_test("Create growth record", False, f"Status: {response.status_code}, Response: {response.text}")
                return
            
            # Get growth records
            response = self.make_request("GET", f"/growth/{self.baby_id}")
            
            if response.status_code == 200:
                growth_records = response.json()
                if isinstance(growth_records, list) and len(growth_records) > 0:
                    self.log_test("Get growth records", True, f"Found {len(growth_records)} growth records")
                else:
                    self.log_test("Get growth records", False, f"No growth records found: {growth_records}")
            else:
                self.log_test("Get growth records", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Growth tracking", False, f"Exception: {str(e)}")
    
    def test_timeline(self):
        """Test timeline endpoint"""
        if not self.baby_id:
            self.log_test("Timeline", False, "No baby_id available")
            return
        
        try:
            response = self.make_request("GET", f"/timeline/{self.baby_id}")
            
            if response.status_code == 200:
                timeline = response.json()
                if isinstance(timeline, list):
                    self.log_test("Get timeline", True, f"Timeline has {len(timeline)} entries")
                else:
                    self.log_test("Get timeline", False, f"Invalid timeline response: {timeline}")
            else:
                self.log_test("Get timeline", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Timeline", False, f"Exception: {str(e)}")
    
    def test_statistics(self):
        """Test statistics endpoint"""
        if not self.baby_id:
            self.log_test("Statistics", False, "No baby_id available")
            return
        
        try:
            response = self.make_request("GET", f"/stats/{self.baby_id}")
            
            if response.status_code == 200:
                stats = response.json()
                if "feeding" in stats and "sleep" in stats and "diaper" in stats:
                    self.log_test("Get statistics", True, 
                                f"Stats: {stats['feeding']['count']} feedings, "
                                f"{stats['sleep']['count']} sleeps, {stats['diaper']['total']} diapers")
                else:
                    self.log_test("Get statistics", False, f"Invalid stats response: {stats}")
            else:
                self.log_test("Get statistics", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Statistics", False, f"Exception: {str(e)}")
    
    def test_sleep_prediction(self):
        """Test sleep prediction endpoint"""
        if not self.baby_id:
            self.log_test("Sleep prediction", False, "No baby_id available")
            return
        
        try:
            response = self.make_request("GET", f"/sleep/prediction/{self.baby_id}")
            
            if response.status_code == 200:
                prediction = response.json()
                if "next_nap_time" in prediction and "confidence" in prediction:
                    self.log_test("Get sleep prediction", True, 
                                f"Next nap: {prediction['next_nap_time']}, "
                                f"Confidence: {prediction['confidence']}")
                else:
                    self.log_test("Get sleep prediction", False, f"Invalid prediction response: {prediction}")
            else:
                self.log_test("Get sleep prediction", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Sleep prediction", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Baby Day Book Backend API Tests")
        print("=" * 60)
        
        # Health checks first
        self.test_health_check()
        
        if not self.session_token:
            print("\n❌ No session token provided. Please run with session token as argument.")
            print("Usage: python backend_test.py <session_token>")
            return False
        
        # Auth test
        self.test_auth_me()
        
        if not self.user_id:
            print("\n❌ Authentication failed. Cannot proceed with protected endpoint tests.")
            return False
        
        print(f"\n✅ Authenticated as user: {self.user_id}")
        print("-" * 60)
        
        # Core functionality tests
        self.test_baby_crud()
        self.test_feeding_tracking()
        self.test_sleep_tracking()
        self.test_diaper_tracking()
        self.test_growth_tracking()
        self.test_timeline()
        self.test_statistics()
        self.test_sleep_prediction()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python backend_test.py <session_token>")
        print("\nFirst create a test user and session using:")
        print("mongosh --eval \"use('test_database'); var visitorId = 'user_' + Date.now(); var sessionToken = 'test_session_' + Date.now(); db.users.insertOne({user_id: visitorId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: 'https://via.placeholder.com/150', created_at: new Date()}); db.user_sessions.insertOne({user_id: visitorId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()}); print('Session token: ' + sessionToken); print('User ID: ' + visitorId);\"")
        return False
    
    session_token = sys.argv[1]
    
    tester = BabyDayBookTester()
    tester.set_session_token(session_token)
    
    success = tester.run_all_tests()
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)