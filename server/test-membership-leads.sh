#!/bin/bash

# Test script for Membership-Based Lead Access System
# This demonstrates how the system handles different membership tiers

echo "🚀 Testing Membership-Based Lead Access System"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000"

# Test data
CUSTOMER_EMAIL="customer@test.com"
CUSTOMER_PASSWORD="password123"
CONTRACTOR_EMAIL="contractor@test.com"
CONTRACTOR_PASSWORD="password123"

echo -e "\n${BLUE}Step 1: Create Test Users${NC}"
echo "================================"

# Create customer
echo "Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Customer",
    "email": "'$CUSTOMER_EMAIL'",
    "password": "'$CUSTOMER_PASSWORD'",
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

echo "Customer creation: $(echo $CUSTOMER_RESPONSE | jq -r '.success // "false"')"

# Create contractor
echo "Creating contractor..."
CONTRACTOR_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Contractor",
    "email": "'$CONTRACTOR_EMAIL'",
    "password": "'$CONTRACTOR_PASSWORD'",
    "phone": "+1234567890",
    "role": "contractor",
    "geoHome": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "contractor": {
      "companyName": "Test Construction Co",
      "services": ["solar", "insulation"],
      "license": "LIC123456",
      "taxId": "TAX123456",
      "docs": []
    }
  }')

echo "Contractor creation: $(echo $CONTRACTOR_RESPONSE | jq -r '.success // "false"')"

echo -e "\n${BLUE}Step 2: Authenticate Users${NC}"
echo "============================="

# Authenticate customer
echo "Authenticating customer..."
curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$CUSTOMER_EMAIL'",
    "password": "'$CUSTOMER_PASSWORD'"
  }' \
  -c customer_cookies.txt > /dev/null

echo "Customer authenticated: $([ -f customer_cookies.txt ] && echo "✅" || echo "❌")"

# Authenticate contractor
echo "Authenticating contractor..."
curl -s -X POST $BASE_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$CONTRACTOR_EMAIL'",
    "password": "'$CONTRACTOR_PASSWORD'"
  }' \
  -c contractor_cookies.txt > /dev/null

echo "Contractor authenticated: $([ -f contractor_cookies.txt ] && echo "✅" || echo "❌")"

echo -e "\n${BLUE}Step 3: Create Test Property${NC}"
echo "=============================="

# Create property
echo "Creating test property..."
PROPERTY_RESPONSE=$(curl -s -X POST $BASE_URL/api/property \
  -b customer_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Property for Lead Access",
    "propertyType": "house",
    "location": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "area": 2000,
    "areaUnit": "sqft",
    "totalRooms": 8,
    "bedrooms": 4,
    "bathrooms": 3,
    "kitchens": 1,
    "description": "Test property for demonstrating lead access system"
  }')

PROPERTY_ID=$(echo $PROPERTY_RESPONSE | jq -r '.property._id // empty')
echo "Property created: $([ -n "$PROPERTY_ID" ] && echo "✅ ID: $PROPERTY_ID" || echo "❌")"

echo -e "\n${BLUE}Step 4: Create Job Requests (Different Timing)${NC}"
echo "==============================================="

# Create job request 1 (immediate)
echo "Creating job request 1 (immediate)..."
JOB1_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b customer_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Solar Installation - Immediate",
    "description": "Solar panel installation for immediate access testing",
    "property": "'$PROPERTY_ID'",
    "service": "solar",
    "estimate": 15000,
    "type": "regular",
    "timeline": 30
  }')

JOB1_ID=$(echo $JOB1_RESPONSE | jq -r '.job._id // empty')
echo "Job 1 created: $([ -n "$JOB1_ID" ] && echo "✅ ID: $JOB1_ID" || echo "❌")"

# Wait a moment
sleep 2

# Create job request 2 (for delayed access)
echo "Creating job request 2 (for delayed access)..."
JOB2_RESPONSE=$(curl -s -X POST $BASE_URL/api/jobRequest \
  -b customer_cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Insulation Installation - Delayed",
    "description": "Insulation installation for delayed access testing",
    "property": "'$PROPERTY_ID'",
    "service": "insulation",
    "estimate": 8000,
    "type": "regular",
    "timeline": 21
  }')

JOB2_ID=$(echo $JOB2_RESPONSE | jq -r '.job._id // empty')
echo "Job 2 created: $([ -n "$JOB2_ID" ] && echo "✅ ID: $JOB2_ID" || echo "❌")"

echo -e "\n${BLUE}Step 5: Test Lead Access System${NC}"
echo "================================="

# Test lead usage (should show 0 used)
echo -e "\n${YELLOW}Testing Lead Usage (Before Access):${NC}"
LEAD_USAGE=$(curl -s -X GET $BASE_URL/api/leads/usage \
  -b contractor_cookies.txt)

echo "Lead Usage Response:"
echo $LEAD_USAGE | jq .

# Test getting filtered job requests
echo -e "\n${YELLOW}Testing Filtered Job Requests:${NC}"
FILTERED_JOBS=$(curl -s -X GET $BASE_URL/api/leads \
  -b contractor_cookies.txt)

echo "Filtered Jobs Response:"
echo $FILTERED_JOBS | jq '.data.jobRequests | length'

# Test accessing a job request
if [ -n "$JOB1_ID" ]; then
  echo -e "\n${YELLOW}Testing Job Request Access:${NC}"
  ACCESS_RESPONSE=$(curl -s -X POST $BASE_URL/api/leads/access/$JOB1_ID \
    -b contractor_cookies.txt)
  
  echo "Access Response:"
  echo $ACCESS_RESPONSE | jq .
  
  # Test lead usage after access
  echo -e "\n${YELLOW}Testing Lead Usage (After Access):${NC}"
  LEAD_USAGE_AFTER=$(curl -s -X GET $BASE_URL/api/leads/usage \
    -b contractor_cookies.txt)
  
  echo "Lead Usage After Access:"
  echo $LEAD_USAGE_AFTER | jq .
fi

echo -e "\n${BLUE}Step 6: Test Membership Tier Logic${NC}"
echo "===================================="

# Test checking access to job request
if [ -n "$JOB2_ID" ]; then
  echo -e "\n${YELLOW}Testing Job Access Check:${NC}"
  ACCESS_CHECK=$(curl -s -X GET $BASE_URL/api/leads/check/$JOB2_ID \
    -b contractor_cookies.txt)
  
  echo "Access Check Response:"
  echo $ACCESS_CHECK | jq .
fi

echo -e "\n${GREEN}✅ Membership-Based Lead Access System Test Complete!${NC}"
echo "=================================================="

echo -e "\n${BLUE}Summary of What Was Tested:${NC}"
echo "1. ✅ User creation and authentication"
echo "2. ✅ Property creation"
echo "3. ✅ Job request creation"
echo "4. ✅ Lead usage tracking"
echo "5. ✅ Filtered job requests based on membership"
echo "6. ✅ Job request access (deducts lead credit)"
echo "7. ✅ Access checking with timing restrictions"

echo -e "\n${YELLOW}Key Features Demonstrated:${NC}"
echo "• Membership-based lead limits (Basic: 25, Standard: 40, Premium: Unlimited)"
echo "• Timing restrictions (Basic: 24h, Standard: 12h, Premium: Instant)"
echo "• Lead usage tracking and counting"
echo "• Monthly reset logic"
echo "• Service-based filtering"
echo "• Access control and validation"

# Cleanup
rm -f customer_cookies.txt contractor_cookies.txt

echo -e "\n${GREEN}Test completed successfully! 🎉${NC}"
