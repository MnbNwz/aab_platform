#!/bin/bash

# AAS Platform API Comprehensive Test Script
# This script tests all endpoints with proper RBAC

BASE_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@aasplatform.com"
ADMIN_PASSWORD="Admin@2025!Secure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name${NC}"
        echo -e "${RED}   Details: $details${NC}"
    else
        echo -e "${YELLOW}⚠️  $test_name${NC}"
        echo -e "${YELLOW}   Details: $details${NC}"
    fi
}

# Function to make API calls and capture response
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    local expected_status="$5"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            $headers)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "$body"
    return $http_code
}

# Function to extract token from response
extract_token() {
    echo "$1" | jq -r '.accessToken // empty'
}

# Function to extract user ID from response
extract_user_id() {
    echo "$1" | jq -r '.user._id // empty'
}

echo -e "${BLUE}🚀 Starting AAS Platform API Comprehensive Testing${NC}"
echo "=================================================="
echo

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check${NC}"
response=$(api_call "GET" "/" "" "" "200")
if [ $? -eq 200 ]; then
    print_result "Health Check" "PASS" "API is responding"
else
    print_result "Health Check" "FAIL" "API not responding"
    exit 1
fi
echo

# Test 2: Admin Signin
echo -e "${YELLOW}2. Testing Admin Signin${NC}"
admin_signin_data='{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
}'
admin_response=$(api_call "POST" "/auth/signin" "$admin_signin_data" "" "200")
if [ $? -eq 200 ]; then
    ADMIN_TOKEN=$(extract_token "$admin_response")
    ADMIN_USER_ID=$(extract_user_id "$admin_response")
    print_result "Admin Signin" "PASS" "Admin authenticated successfully"
    echo "Admin Token: ${ADMIN_TOKEN:0:20}..."
    echo "Admin User ID: $ADMIN_USER_ID"
else
    print_result "Admin Signin" "FAIL" "Admin authentication failed"
    echo "Response: $admin_response"
    exit 1
fi
echo

# Test 3: Customer Signup
echo -e "${YELLOW}3. Testing Customer Signup${NC}"
customer_signup_data='{
    "firstName": "Test",
    "lastName": "Customer",
    "email": "test.customer@example.com",
    "password": "TestPass123!",
    "phone": "+1234567890",
    "role": "customer",
    "geoHome": {
        "type": "Point",
        "coordinates": [-74.006, 40.7128]
    },
    "customer": {
        "defaultPropertyType": "domestic"
    }
}'
customer_response=$(api_call "POST" "/auth/signup" "$customer_signup_data" "" "201")
if [ $? -eq 201 ]; then
    CUSTOMER_TOKEN=$(extract_token "$customer_response")
    CUSTOMER_USER_ID=$(extract_user_id "$customer_response")
    print_result "Customer Signup" "PASS" "Customer created successfully"
    echo "Customer Token: ${CUSTOMER_TOKEN:0:20}..."
    echo "Customer User ID: $CUSTOMER_USER_ID"
else
    print_result "Customer Signup" "FAIL" "Customer creation failed"
    echo "Response: $customer_response"
fi
echo

# Test 4: Contractor Signup
echo -e "${YELLOW}4. Testing Contractor Signup${NC}"
contractor_signup_data='{
    "firstName": "Test",
    "lastName": "Contractor",
    "email": "test.contractor@example.com",
    "password": "TestPass123!",
    "phone": "+1234567891",
    "role": "contractor",
    "geoHome": {
        "type": "Point",
        "coordinates": [-74.006, 40.7128]
    },
    "contractor": {
        "companyName": "TestCorp Contracting LLC",
        "services": ["plumbing", "electrical"],
        "license": "LIC123456",
        "taxId": "TAX123456",
        "docs": [{"type": "license", "url": "https://example.com/license.pdf"}]
    }
}'
contractor_response=$(api_call "POST" "/auth/signup" "$contractor_signup_data" "" "201")
if [ $? -eq 201 ]; then
    CONTRACTOR_TOKEN=$(extract_token "$contractor_response")
    CONTRACTOR_USER_ID=$(extract_user_id "$contractor_response")
    print_result "Contractor Signup" "PASS" "Contractor created successfully"
    echo "Contractor Token: ${CONTRACTOR_TOKEN:0:20}..."
    echo "Contractor User ID: $CONTRACTOR_USER_ID"
else
    print_result "Contractor Signup" "FAIL" "Contractor creation failed"
    echo "Response: $contractor_response"
fi
echo

# Test 5: Get User Profile (Customer)
echo -e "${YELLOW}5. Testing Get User Profile (Customer)${NC}"
if [ -n "$CUSTOMER_TOKEN" ]; then
    profile_response=$(api_call "GET" "/auth/profile" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Get Customer Profile" "PASS" "Profile retrieved successfully"
    else
        print_result "Get Customer Profile" "FAIL" "Profile retrieval failed"
        echo "Response: $profile_response"
    fi
else
    print_result "Get Customer Profile" "SKIP" "No customer token available"
fi
echo

# Test 6: Admin - Get All Users
echo -e "${YELLOW}6. Testing Admin - Get All Users${NC}"
if [ -n "$ADMIN_TOKEN" ]; then
    users_response=$(api_call "GET" "/admin/users" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Admin Get Users" "PASS" "Users retrieved successfully"
        user_count=$(echo "$users_response" | jq '.users | length')
        echo "Total users: $user_count"
    else
        print_result "Admin Get Users" "FAIL" "Users retrieval failed"
        echo "Response: $users_response"
    fi
else
    print_result "Admin Get Users" "SKIP" "No admin token available"
fi
echo

# Test 7: Admin - Approve Customer
echo -e "${YELLOW}7. Testing Admin - Approve Customer${NC}"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$CUSTOMER_USER_ID" ]; then
    approve_data='{
        "status": "active",
        "approval": "approved"
    }'
    approve_response=$(api_call "PUT" "/admin/users/$CUSTOMER_USER_ID" "$approve_data" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Admin Approve Customer" "PASS" "Customer approved successfully"
    else
        print_result "Admin Approve Customer" "FAIL" "Customer approval failed"
        echo "Response: $approve_response"
    fi
else
    print_result "Admin Approve Customer" "SKIP" "Missing admin token or customer ID"
fi
echo

# Test 8: Admin - Approve Contractor
echo -e "${YELLOW}8. Testing Admin - Approve Contractor${NC}"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$CONTRACTOR_USER_ID" ]; then
    approve_data='{
        "status": "active",
        "approval": "approved"
    }'
    approve_response=$(api_call "PUT" "/admin/users/$CONTRACTOR_USER_ID" "$approve_data" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Admin Approve Contractor" "PASS" "Contractor approved successfully"
    else
        print_result "Admin Approve Contractor" "FAIL" "Contractor approval failed"
        echo "Response: $approve_response"
    fi
else
    print_result "Admin Approve Contractor" "SKIP" "Missing admin token or contractor ID"
fi
echo

# Test 9: Get Services (Public)
echo -e "${YELLOW}9. Testing Get Services (Public)${NC}"
services_response=$(api_call "GET" "/services" "" "" "200")
if [ $? -eq 200 ]; then
    print_result "Get Services" "PASS" "Services retrieved successfully"
    service_count=$(echo "$services_response" | jq '.services | length')
    echo "Available services: $service_count"
else
    print_result "Get Services" "FAIL" "Services retrieval failed"
    echo "Response: $services_response"
fi
echo

# Test 10: Get Membership Plans
echo -e "${YELLOW}10. Testing Get Membership Plans${NC}"
if [ -n "$CUSTOMER_TOKEN" ]; then
    plans_response=$(api_call "GET" "/membership/plans" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Get Membership Plans" "PASS" "Plans retrieved successfully"
        plan_count=$(echo "$plans_response" | jq '.plans | length')
        echo "Available plans: $plan_count"
    else
        print_result "Get Membership Plans" "FAIL" "Plans retrieval failed"
        echo "Response: $plans_response"
    fi
else
    print_result "Get Membership Plans" "SKIP" "No customer token available"
fi
echo

# Test 11: Create Property (Customer)
echo -e "${YELLOW}11. Testing Create Property (Customer)${NC}"
if [ -n "$CUSTOMER_TOKEN" ]; then
    # Note: This would normally be a multipart form, but for testing we'll use JSON
    property_data='{
        "address": "123 Test Street, New York, NY 10001",
        "propertyType": "domestic",
        "bedrooms": 3,
        "bathrooms": 2,
        "squareFootage": 1500,
        "yearBuilt": 2010,
        "description": "Test property for API testing"
    }'
    property_response=$(api_call "POST" "/property" "$property_data" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        PROPERTY_ID=$(echo "$property_response" | jq -r '.property._id // empty')
        print_result "Create Property" "PASS" "Property created successfully"
        echo "Property ID: $PROPERTY_ID"
    else
        print_result "Create Property" "FAIL" "Property creation failed"
        echo "Response: $property_response"
    fi
else
    print_result "Create Property" "SKIP" "No customer token available"
fi
echo

# Test 12: Create Job Request (Customer)
echo -e "${YELLOW}12. Testing Create Job Request (Customer)${NC}"
if [ -n "$CUSTOMER_TOKEN" ] && [ -n "$PROPERTY_ID" ]; then
    job_request_data='{
        "title": "Kitchen Renovation Test",
        "description": "Complete kitchen renovation for API testing",
        "propertyId": "'$PROPERTY_ID'",
        "serviceType": "general",
        "budget": 15000,
        "preferredStartDate": "2024-02-01",
        "preferredEndDate": "2024-03-01",
        "urgency": "medium",
        "location": {
            "address": "123 Test Street, New York, NY 10001",
            "coordinates": [-74.006, 40.7128]
        },
        "requirements": [
            "Licensed contractor required",
            "Insurance required"
        ]
    }'
    job_response=$(api_call "POST" "/jobRequest" "$job_request_data" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "201")
    if [ $? -eq 201 ]; then
        JOB_REQUEST_ID=$(echo "$job_response" | jq -r '.jobRequest._id // empty')
        print_result "Create Job Request" "PASS" "Job request created successfully"
        echo "Job Request ID: $JOB_REQUEST_ID"
    else
        print_result "Create Job Request" "FAIL" "Job request creation failed"
        echo "Response: $job_response"
    fi
else
    print_result "Create Job Request" "SKIP" "Missing customer token or property ID"
fi
echo

# Test 13: Create Bid (Contractor)
echo -e "${YELLOW}13. Testing Create Bid (Contractor)${NC}"
if [ -n "$CONTRACTOR_TOKEN" ] && [ -n "$JOB_REQUEST_ID" ]; then
    bid_data='{
        "jobRequestId": "'$JOB_REQUEST_ID'",
        "amount": 12000,
        "description": "Professional kitchen renovation with high-quality materials",
        "timeline": "4-6 weeks",
        "startDate": "2024-02-01",
        "endDate": "2024-03-15",
        "terms": [
            "15% deposit required",
            "25% pre-start payment",
            "60% upon completion"
        ]
    }'
    bid_response=$(api_call "POST" "/contractor/bid" "$bid_data" "-H 'Authorization: Bearer $CONTRACTOR_TOKEN'" "201")
    if [ $? -eq 201 ]; then
        BID_ID=$(echo "$bid_response" | jq -r '.bid._id // empty')
        print_result "Create Bid" "PASS" "Bid created successfully"
        echo "Bid ID: $BID_ID"
    else
        print_result "Create Bid" "FAIL" "Bid creation failed"
        echo "Response: $bid_response"
    fi
else
    print_result "Create Bid" "SKIP" "Missing contractor token or job request ID"
fi
echo

# Test 14: RBAC Security Test - Unauthorized Access
echo -e "${YELLOW}14. Testing RBAC Security - Unauthorized Access${NC}"
unauthorized_response=$(api_call "GET" "/admin/users" "" "" "401")
if [ $? -eq 401 ]; then
    print_result "RBAC Security Test" "PASS" "Unauthorized access properly blocked"
else
    print_result "RBAC Security Test" "FAIL" "Security vulnerability detected"
    echo "Response: $unauthorized_response"
fi
echo

# Test 15: RBAC Security Test - Wrong Role Access
echo -e "${YELLOW}15. Testing RBAC Security - Wrong Role Access${NC}"
if [ -n "$CUSTOMER_TOKEN" ]; then
    wrong_role_response=$(api_call "GET" "/admin/users" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "403")
    if [ $? -eq 403 ]; then
        print_result "Wrong Role Access Test" "PASS" "Customer properly blocked from admin endpoints"
    else
        print_result "Wrong Role Access Test" "FAIL" "Role-based access control not working"
        echo "Response: $wrong_role_response"
    fi
else
    print_result "Wrong Role Access Test" "SKIP" "No customer token available"
fi
echo

# Test 16: Logout Test
echo -e "${YELLOW}16. Testing Logout${NC}"
if [ -n "$CUSTOMER_TOKEN" ]; then
    logout_response=$(api_call "POST" "/auth/logout" "" "-H 'Authorization: Bearer $CUSTOMER_TOKEN'" "200")
    if [ $? -eq 200 ]; then
        print_result "Logout Test" "PASS" "User logged out successfully"
    else
        print_result "Logout Test" "FAIL" "Logout failed"
        echo "Response: $logout_response"
    fi
else
    print_result "Logout Test" "SKIP" "No customer token available"
fi
echo

echo -e "${BLUE}🏁 API Testing Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All critical endpoints tested with proper RBAC${NC}"
echo -e "${YELLOW}⚠️  Note: Stripe-dependent payment endpoints were skipped${NC}"
echo -e "${BLUE}📊 Check the results above for any failures${NC}"
