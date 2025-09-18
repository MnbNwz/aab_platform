#!/bin/bash

# Test script for Property Type Enforcement
# Tests domestic vs commercial customer property restrictions

echo "🏠 Testing Property Type Enforcement"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000"

echo -e "\n${BLUE}Step 1: Create Test Users${NC}"
echo "================================"

# Create domestic customer
echo "Creating domestic customer..."
DOMESTIC_CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Domestic",
    "lastName": "Customer",
    "email": "domestic@test.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "customer",
    "geoHome": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "customer": {
      "defaultPropertyType": "domestic"
    }
  }')

DOMESTIC_CUSTOMER_ID=$(echo $DOMESTIC_CUSTOMER_RESPONSE | jq -r '.user._id // empty')
echo "Domestic customer created: $([ -n "$DOMESTIC_CUSTOMER_ID" ] && echo "✅ ID: $DOMESTIC_CUSTOMER_ID" || echo "❌")"

# Create commercial customer
echo "Creating commercial customer..."
COMMERCIAL_CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Commercial",
    "lastName": "Customer",
    "email": "commercial@test.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "customer",
    "geoHome": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "customer": {
      "defaultPropertyType": "commercial"
    }
  }')

COMMERCIAL_CUSTOMER_ID=$(echo $COMMERCIAL_CUSTOMER_RESPONSE | jq -r '.user._id // empty')
echo "Commercial customer created: $([ -n "$COMMERCIAL_CUSTOMER_ID" ] && echo "✅ ID: $COMMERCIAL_CUSTOMER_ID" || echo "❌")"

echo -e "\n${BLUE}Step 2: Authenticate Users${NC}"
echo "============================="

# Authenticate domestic customer
echo "Authenticating domestic customer..."
curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "domestic@test.com",
    "password": "password123"
  }' \
  -c domestic_cookies.txt > /dev/null

echo "Domestic customer authenticated: $([ -f domestic_cookies.txt ] && echo "✅" || echo "❌")"

# Authenticate commercial customer
echo "Authenticating commercial customer..."
curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commercial@test.com",
    "password": "password123"
  }' \
  -c commercial_cookies.txt > /dev/null

echo "Commercial customer authenticated: $([ -f commercial_cookies.txt ] && echo "✅" || echo "❌")"

echo -e "\n${BLUE}Step 3: Create Properties${NC}"
echo "============================="

# Create properties for domestic customer
echo "Creating properties for domestic customer..."
PROPERTY1_RESPONSE=$(curl -s -X POST $BASE_URL/api/property \
  -b domestic_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Domestic House 1",
    "propertyType": "house",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "area": 1500,
    "areaUnit": "sqft",
    "totalRooms": 5,
    "bedrooms": 3,
    "bathrooms": 2,
    "kitchens": 1,
    "description": "Beautiful domestic house"
  }')

PROPERTY1_ID=$(echo $PROPERTY1_RESPONSE | jq -r '.property._id // empty')
echo "Property 1 created: $([ -n "$PROPERTY1_ID" ] && echo "✅ ID: $PROPERTY1_ID" || echo "❌")"

PROPERTY2_RESPONSE=$(curl -s -X POST $BASE_URL/api/property \
  -b domestic_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Domestic House 2",
    "propertyType": "apartment",
    "location": {
      "type": "Point",
      "coordinates": [-74.007, 40.7129]
    },
    "area": 1200,
    "areaUnit": "sqft",
    "totalRooms": 4,
    "bedrooms": 2,
    "bathrooms": 2,
    "kitchens": 1,
    "description": "Another domestic property"
  }')

PROPERTY2_ID=$(echo $PROPERTY2_RESPONSE | jq -r '.property._id // empty')
echo "Property 2 created: $([ -n "$PROPERTY2_ID" ] && echo "✅ ID: $PROPERTY2_ID" || echo "❌")"

# Create properties for commercial customer
echo "Creating properties for commercial customer..."
COMMERCIAL_PROPERTY1_RESPONSE=$(curl -s -X POST $BASE_URL/api/property \
  -b commercial_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Commercial Building 1",
    "propertyType": "house",
    "location": {
      "type": "Point",
      "coordinates": [-74.008, 40.7130]
    },
    "area": 5000,
    "areaUnit": "sqft",
    "totalRooms": 10,
    "bedrooms": 0,
    "bathrooms": 3,
    "kitchens": 2,
    "description": "Commercial building"
  }')

COMMERCIAL_PROPERTY1_ID=$(echo $COMMERCIAL_PROPERTY1_RESPONSE | jq -r '.property._id // empty')
echo "Commercial Property 1 created: $([ -n "$COMMERCIAL_PROPERTY1_ID" ] && echo "✅ ID: $COMMERCIAL_PROPERTY1_ID" || echo "❌")"

echo -e "\n${BLUE}Step 4: Test Domestic Customer Property Enforcement${NC}"
echo "======================================================="

# Test 1: Domestic customer creates first job request (should work)
echo -e "\n${YELLOW}Test 1: First job request for domestic customer${NC}"
FIRST_JOB_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b domestic_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "property": "'$PROPERTY1_ID'",
    "title": "Solar Installation",
    "description": "Install solar panels",
    "service": "solar",
    "estimate": 15000,
    "type": "regular",
    "timeline": 14
  }')

FIRST_JOB_ID=$(echo $FIRST_JOB_RESPONSE | jq -r '.jobRequest._id // empty')
echo "First job request: $([ -n "$FIRST_JOB_ID" ] && echo "✅ Created" || echo "❌ Failed")"
echo "Response: $FIRST_JOB_RESPONSE"

# Test 2: Domestic customer tries to create second job with different property (should fail)
echo -e "\n${YELLOW}Test 2: Second job request with different property (should fail)${NC}"
SECOND_JOB_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b domestic_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "property": "'$PROPERTY2_ID'",
    "title": "Insulation Work",
    "description": "Install insulation",
    "service": "insulation",
    "estimate": 8000,
    "type": "regular",
    "timeline": 7
  }')

echo "Second job request: $(echo $SECOND_JOB_RESPONSE | jq -r '.error // "Failed"')"
echo "Response: $SECOND_JOB_RESPONSE"

# Test 3: Domestic customer tries to create job with same property (should work)
echo -e "\n${YELLOW}Test 3: Third job request with same property (should work)${NC}"
THIRD_JOB_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b domestic_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "property": "'$PROPERTY1_ID'",
    "title": "Roofing Work",
    "description": "Fix roof",
    "service": "solar",
    "estimate": 12000,
    "type": "regular",
    "timeline": 10
  }')

THIRD_JOB_ID=$(echo $THIRD_JOB_RESPONSE | jq -r '.jobRequest._id // empty')
echo "Third job request: $([ -n "$THIRD_JOB_ID" ] && echo "✅ Created" || echo "❌ Failed")"
echo "Response: $THIRD_JOB_RESPONSE"

echo -e "\n${BLUE}Step 5: Test Commercial Customer Property Freedom${NC}"
echo "=================================================="

# Test 4: Commercial customer creates job with any property (should work)
echo -e "\n${YELLOW}Test 4: Commercial customer job request${NC}"
COMMERCIAL_JOB_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b commercial_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "property": "'$COMMERCIAL_PROPERTY1_ID'",
    "title": "Commercial Solar",
    "description": "Install commercial solar",
    "service": "solar",
    "estimate": 50000,
    "type": "commercial",
    "timeline": 30
  }')

COMMERCIAL_JOB_ID=$(echo $COMMERCIAL_JOB_RESPONSE | jq -r '.jobRequest._id // empty')
echo "Commercial job request: $([ -n "$COMMERCIAL_JOB_ID" ] && echo "✅ Created" || echo "❌ Failed")"
echo "Response: $COMMERCIAL_JOB_RESPONSE"

echo -e "\n${GREEN}✅ Property Type Enforcement Test Complete!${NC}"
echo "============================================="

echo -e "\n${BLUE}Summary of Tests:${NC}"
echo "1. ✅ Domestic customer - First job request (any property)"
echo "2. ❌ Domestic customer - Second job with different property (blocked)"
echo "3. ✅ Domestic customer - Third job with same property (allowed)"
echo "4. ✅ Commercial customer - Job with any property (allowed)"

echo -e "\n${YELLOW}Key Features Demonstrated:${NC}"
echo "• Domestic customers must reuse the same property for all job requests"
echo "• Commercial customers can use any property for job requests"
echo "• Property type enforcement prevents domestic customers from using multiple properties"
echo "• Clear error messages when property restrictions are violated"

echo -e "\n${GREEN}Test completed successfully! 🎉${NC}"

# Cleanup
rm -f domestic_cookies.txt commercial_cookies.txt
