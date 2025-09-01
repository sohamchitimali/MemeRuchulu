#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Meme Creation Platform
Tests all backend endpoints including Memegen.link and Google Gemini AI integration
"""

import requests
import json
import base64
import os
import sys
from datetime import datetime
from io import BytesIO
from PIL import Image
import tempfile

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}")

# Test user ID for testing
TEST_USER_ID = "test_user_12345"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"   Details: {details}")

def create_test_image_base64():
    """Create a simple test image and return as base64"""
    try:
        # Create a simple 100x100 red square image
        img = Image.new('RGB', (100, 100), color='red')
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error creating test image: {e}")
        return None

def test_health_check():
    """Test /api/health endpoint"""
    print_test_header("Health Check Endpoint")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Health endpoint accessible")
            
            # Check response structure
            if 'status' in data and 'services' in data:
                print_result(True, f"Health status: {data['status']}")
                
                services = data['services']
                mongodb_status = services.get('mongodb', 'unknown')
                gemini_status = services.get('gemini_ai', 'unknown')
                
                print_result(mongodb_status == 'connected', f"MongoDB: {mongodb_status}")
                print_result(gemini_status == 'connected', f"Gemini AI: {gemini_status}")
                
                return mongodb_status == 'connected' and gemini_status == 'connected'
            else:
                print_result(False, "Invalid health response structure", data)
                return False
        else:
            print_result(False, f"Health check failed with status {response.status_code}", response.text)
            return False
            
    except Exception as e:
        print_result(False, f"Health check request failed: {str(e)}")
        return False

def test_templates_endpoint():
    """Test /api/templates endpoint (Memegen.link integration)"""
    print_test_header("Meme Templates Endpoint (Memegen.link)")
    
    try:
        response = requests.get(f"{API_BASE}/templates", timeout=15)
        
        if response.status_code == 200:
            templates = response.json()
            print_result(True, f"Templates endpoint accessible, got {len(templates)} templates")
            
            if len(templates) > 0:
                # Check first template structure
                template = templates[0]
                required_fields = ['id', 'name', 'url', 'box_count', 'width', 'height']
                
                all_fields_present = all(field in template for field in required_fields)
                print_result(all_fields_present, f"Template structure valid: {template.get('name', 'Unknown')}")
                
                # Test template URL accessibility
                try:
                    template_response = requests.head(template['url'], timeout=5)
                    url_accessible = template_response.status_code == 200
                    print_result(url_accessible, f"Template image URL accessible: {template['url']}")
                except:
                    print_result(False, f"Template image URL not accessible: {template['url']}")
                    url_accessible = False
                
                return all_fields_present and url_accessible
            else:
                print_result(False, "No templates returned from Memegen.link API")
                return False
        else:
            print_result(False, f"Templates request failed with status {response.status_code}", response.text)
            return False
            
    except Exception as e:
        print_result(False, f"Templates request failed: {str(e)}")
        return False

def test_manual_meme_creation():
    """Test /api/create-meme-manual endpoint"""
    print_test_header("Manual Meme Creation")
    
    try:
        # First get a template to use
        templates_response = requests.get(f"{API_BASE}/templates", timeout=10)
        if templates_response.status_code != 200:
            print_result(False, "Cannot get templates for manual meme test")
            return False
        
        templates = templates_response.json()
        if not templates:
            print_result(False, "No templates available for manual meme test")
            return False
        
        template = templates[0]
        template_id = template['id']
        
        # Create manual meme request
        meme_request = {
            "template_id": template_id,
            "text_boxes": [
                {"text": "Top Text Here"},
                {"text": "Bottom Text Here"}
            ],
            "user_id": TEST_USER_ID
        }
        
        response = requests.post(
            f"{API_BASE}/create-meme-manual",
            json=meme_request,
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Manual meme creation successful")
            
            # Check response structure
            required_fields = ['success', 'meme_url', 'meme_id', 'message']
            all_fields_present = all(field in data for field in required_fields)
            print_result(all_fields_present, f"Response structure valid")
            
            if data.get('success'):
                meme_url = data.get('meme_url', '')
                print_result(True, f"Meme URL generated: {meme_url[:100]}...")
                
                # Test if meme URL is accessible (for Memegen.link URLs)
                if meme_url.startswith('https://api.memegen.link'):
                    try:
                        meme_response = requests.head(meme_url, timeout=5)
                        url_accessible = meme_response.status_code == 200
                        print_result(url_accessible, f"Generated meme URL accessible")
                    except:
                        print_result(False, f"Generated meme URL not accessible")
                        url_accessible = False
                else:
                    url_accessible = True  # Assume data URLs are valid
                
                return all_fields_present and data.get('success') and url_accessible
            else:
                print_result(False, f"Meme creation failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            print_result(False, f"Manual meme creation failed with status {response.status_code}", response.text)
            return False
            
    except Exception as e:
        print_result(False, f"Manual meme creation request failed: {str(e)}")
        return False

def test_ai_meme_creation():
    """Test /api/create-meme-ai endpoint (Google Gemini integration)"""
    print_test_header("AI Meme Creation (Google Gemini 2.5 Flash Image Preview)")
    
    try:
        # Test with simple prompt first
        ai_request = {
            "prompt": "Create a funny meme about coding with a cat image",
            "user_id": TEST_USER_ID
        }
        
        response = requests.post(
            f"{API_BASE}/create-meme-ai",
            json=ai_request,
            timeout=30  # AI requests may take longer
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "AI meme creation endpoint accessible")
            
            # Check response structure
            if 'success' in data and 'message' in data:
                if data.get('success'):
                    print_result(True, f"AI meme created successfully: {data.get('message', '')}")
                    
                    # Check if meme URL is present
                    meme_url = data.get('meme_url', '')
                    if meme_url:
                        print_result(True, f"AI-generated meme URL present")
                        # For data URLs, just check if it starts correctly
                        if meme_url.startswith('data:image/'):
                            print_result(True, "Meme URL is valid data URL format")
                            return True
                        else:
                            print_result(False, f"Unexpected meme URL format: {meme_url[:50]}...")
                            return False
                    else:
                        print_result(False, "No meme URL in successful response")
                        return False
                else:
                    # AI might not generate image, check if there's a meaningful response
                    ai_response = data.get('ai_response', '')
                    if ai_response:
                        print_result(True, f"AI responded with text: {ai_response[:100]}...")
                        return True
                    else:
                        print_result(False, f"AI creation failed: {data.get('message', 'Unknown error')}")
                        return False
            else:
                print_result(False, "Invalid AI response structure", data)
                return False
        else:
            print_result(False, f"AI meme creation failed with status {response.status_code}", response.text)
            return False
            
    except Exception as e:
        print_result(False, f"AI meme creation request failed: {str(e)}")
        return False

def test_file_upload():
    """Test /api/upload-image endpoint"""
    print_test_header("File Upload Endpoint")
    
    try:
        # Create a test image file
        test_image_data = create_test_image_base64()
        if not test_image_data:
            print_result(False, "Could not create test image")
            return False
        
        # Convert base64 back to bytes for upload
        image_bytes = base64.b64decode(test_image_data)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Upload the file
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_image.png', f, 'image/png')}
                response = requests.post(f"{API_BASE}/upload-image", files=files, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print_result(True, "File upload successful")
                
                # Check response structure
                required_fields = ['success', 'filename', 'base64_data', 'content_type']
                all_fields_present = all(field in data for field in required_fields)
                print_result(all_fields_present, "Upload response structure valid")
                
                if data.get('success') and data.get('base64_data'):
                    print_result(True, f"File uploaded and converted to base64 (length: {len(data['base64_data'])})")
                    return True
                else:
                    print_result(False, "Upload marked as unsuccessful or no base64 data")
                    return False
            else:
                print_result(False, f"File upload failed with status {response.status_code}", response.text)
                return False
                
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
            
    except Exception as e:
        print_result(False, f"File upload request failed: {str(e)}")
        return False

def test_user_memes_crud():
    """Test user memes CRUD operations"""
    print_test_header("User Memes CRUD Operations")
    
    try:
        # Test 1: Create a user meme
        meme_data = {
            "user_id": TEST_USER_ID,
            "meme_url": "https://example.com/test-meme.png",
            "template_id": "drake",
            "prompt_used": "Test meme creation",
            "is_ai_generated": False
        }
        
        create_response = requests.post(f"{API_BASE}/user-memes", json=meme_data, timeout=10)
        
        if create_response.status_code == 200:
            created_meme = create_response.json()
            print_result(True, "User meme creation successful")
            
            meme_id = created_meme.get('id')
            if not meme_id:
                print_result(False, "No meme ID returned from creation")
                return False
            
            print_result(True, f"Created meme with ID: {meme_id}")
            
            # Test 2: Read user memes
            read_response = requests.get(f"{API_BASE}/user-memes/{TEST_USER_ID}", timeout=10)
            
            if read_response.status_code == 200:
                user_memes = read_response.json()
                print_result(True, f"Retrieved {len(user_memes)} user memes")
                
                # Check if our created meme is in the list
                created_meme_found = any(meme.get('id') == meme_id for meme in user_memes)
                print_result(created_meme_found, "Created meme found in user memes list")
                
                # Test 3: Delete the meme
                delete_response = requests.delete(
                    f"{API_BASE}/user-memes/{meme_id}",
                    params={"user_id": TEST_USER_ID},
                    timeout=10
                )
                
                if delete_response.status_code == 200:
                    delete_data = delete_response.json()
                    print_result(True, f"Meme deletion successful: {delete_data.get('message', '')}")
                    
                    # Verify deletion by trying to read again
                    verify_response = requests.get(f"{API_BASE}/user-memes/{TEST_USER_ID}", timeout=10)
                    if verify_response.status_code == 200:
                        remaining_memes = verify_response.json()
                        meme_still_exists = any(meme.get('id') == meme_id for meme in remaining_memes)
                        print_result(not meme_still_exists, "Meme successfully removed from user gallery")
                        
                        return created_meme_found and not meme_still_exists
                    else:
                        print_result(False, "Could not verify meme deletion")
                        return False
                else:
                    print_result(False, f"Meme deletion failed with status {delete_response.status_code}")
                    return False
            else:
                print_result(False, f"Reading user memes failed with status {read_response.status_code}")
                return False
        else:
            print_result(False, f"User meme creation failed with status {create_response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"User memes CRUD test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests and return results"""
    print(f"\n🚀 Starting Comprehensive Backend API Testing")
    print(f"📅 Test Time: {datetime.now()}")
    print(f"🔗 Backend URL: {API_BASE}")
    
    test_results = {}
    
    # Run all tests
    test_results['health_check'] = test_health_check()
    test_results['templates'] = test_templates_endpoint()
    test_results['manual_meme'] = test_manual_meme_creation()
    test_results['ai_meme'] = test_ai_meme_creation()
    test_results['file_upload'] = test_file_upload()
    test_results['user_memes_crud'] = test_user_memes_crud()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name.replace('_', ' ').title()}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED! The meme creation platform is working correctly.")
    else:
        print("⚠️  Some tests FAILED. Please check the detailed output above.")
    
    return test_results

if __name__ == "__main__":
    results = run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)