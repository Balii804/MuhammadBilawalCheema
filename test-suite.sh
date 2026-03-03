#!/bin/bash

###############################################################################
# Comprehensive Test Suite for GGI Backend Test
# Tests all scenarios, edge cases, and requirements
###############################################################################

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

###############################################################################
# Helper Functions
###############################################################################

print_test() {
    TOTAL=$((TOTAL + 1))
    echo -e "${BLUE}[TEST $TOTAL]${NC} $1"
}

print_pass() {
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✓ PASSED${NC}: $1"
}

print_fail() {
    FAILED=$((FAILED + 1))
    echo -e "${RED}✗ FAILED${NC}: $1"
}

check_response() {
    local response="$1"
    local expected_key="$2"
    local expected_value="$3"
    local test_name="$4"
    
    if echo "$response" | grep -q "\"$expected_key\""; then
        if [ -z "$expected_value" ] || echo "$response" | grep -q "$expected_value"; then
            print_pass "$test_name"
            return 0
        fi
    fi
    print_fail "$test_name - Expected: $expected_key=$expected_value"
    echo "Response: $response"
    return 1
}

check_error() {
    local response="$1"
    local expected_code="$2"
    local test_name="$3"
    
    if echo "$response" | grep -q "\"code\":\"$expected_code\""; then
        print_pass "$test_name"
        return 0
    fi
    print_fail "$test_name - Expected error code: $expected_code"
    echo "Response: $response"
    return 1
}

make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data"
    fi
}

###############################################################################
# Test Suite
###############################################################################

echo -e "${YELLOW}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     GGI Backend Test - Comprehensive Test Suite               ║"
echo "║     Testing all scenarios, edge cases, and requirements      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

###############################################################################
# SECTION 1: Health & Basic Connectivity
###############################################################################

echo -e "${YELLOW}SECTION 1: Health & Basic Connectivity${NC}\n"

print_test "Health check endpoint"
RESPONSE=$(make_request GET "/health")
check_response "$RESPONSE" "status" "ok" "Health endpoint should return ok status"

###############################################################################
# SECTION 2: FREE QUOTA TRACKING
###############################################################################

echo -e "\n${YELLOW}SECTION 2: FREE QUOTA TRACKING - 3 messages per month${NC}\n"

print_test "User gets 3 free messages per month - Message 1/3"
RESPONSE=$(make_request POST "/api/chat" '{"userId":"user-free-1","question":"First free message"}')
check_response "$RESPONSE" "remainingFreeMessages" "2" "First free message should have 2 remaining"
check_response "$RESPONSE" "usedQuotaType" "FREE" "Should use FREE quota"

print_test "User gets 3 free messages per month - Message 2/3"
RESPONSE=$(make_request POST "/api/chat" '{"userId":"user-free-1","question":"Second free message"}')
check_response "$RESPONSE" "remainingFreeMessages" "1" "Second free message should have 1 remaining"

print_test "User gets 3 free messages per month - Message 3/3"
RESPONSE=$(make_request POST "/api/chat" '{"userId":"user-free-1","question":"Third free message"}')
check_response "$RESPONSE" "remainingFreeMessages" "0" "Third free message should have 0 remaining"

print_test "Fourth message should fail - quota exceeded"
RESPONSE=$(make_request POST "/api/chat" '{"userId":"user-free-1","question":"Fourth - should fail"}')
check_error "$RESPONSE" "INSUFFICIENT_QUOTA" "Should return INSUFFICIENT_QUOTA error"

print_test "Verify tokens are stored in database"
RESPONSE=$(make_request GET "/api/chat/history?userId=user-free-1&limit=3")
check_response "$RESPONSE" "tokensUsed" "" "Should have tokensUsed in history"

###############################################################################
# SECTION 3: SUBSCRIPTION BUNDLES - All Tiers
###############################################################################

echo -e "\n${YELLOW}SECTION 3: SUBSCRIPTION BUNDLES - All Tiers${NC}\n"

print_test "Create BASIC subscription - 10 messages"
RESPONSE=$(make_request POST "/api/subscriptions" '{"userId":"user-sub-1","tier":"BASIC","billingCycle":"MONTHLY","autoRenew":true}')
check_response "$RESPONSE" "tier" "BASIC" "Should create BASIC subscription"
check_response "$RESPONSE" "maxMessages" "10" "BASIC should have 10 maxMessages"
check_response "$RESPONSE" "price" "10" "BASIC should cost 10"
check_response "$RESPONSE" "status" "ACTIVE" "Should be ACTIVE"
BASIC_SUB_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

print_test "Create PRO subscription - 100 messages"
RESPONSE=$(make_request POST "/api/subscriptions" '{"userId":"user-sub-2","tier":"PRO","billingCycle":"MONTHLY","autoRenew":false}')
check_response "$RESPONSE" "tier" "PRO" "Should create PRO subscription"
check_response "$RESPONSE" "maxMessages" "100" "PRO should have 100 maxMessages"
check_response "$RESPONSE" "price" "50" "PRO should cost 50"
PRO_SUB_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

print_test "Create ENTERPRISE subscription - unlimited"
RESPONSE=$(make_request POST "/api/subscriptions" '{"userId":"user-sub-3","tier":"ENTERPRISE","billingCycle":"YEARLY","autoRenew":true}')
check_response "$RESPONSE" "tier" "ENTERPRISE" "Should create ENTERPRISE subscription"
check_response "$RESPONSE" "maxMessages" "null" "ENTERPRISE should have null - unlimited"
check_response "$RESPONSE" "price" "200" "ENTERPRISE should cost 200"
check_response "$RESPONSE" "billingCycle" "YEARLY" "Should support YEARLY billing"

###############################################################################
# SECTION 4: CHAT WITH SUBSCRIPTIONS
###############################################################################

echo -e "\n${YELLOW}SECTION 4: CHAT WITH SUBSCRIPTIONS${NC}\n"

print_test "Chat with subscription after free quota exhausted"
make_request POST "/api/chat" '{"userId":"user-sub-chat","question":"Free 1"}' > /dev/null
make_request POST "/api/chat" '{"userId":"user-sub-chat","question":"Free 2"}' > /dev/null
make_request POST "/api/chat" '{"userId":"user-sub-chat","question":"Free 3"}' > /dev/null
make_request POST "/api/subscriptions" '{"userId":"user-sub-chat","tier":"PRO","billingCycle":"MONTHLY","autoRenew":true}' > /dev/null
RESPONSE=$(make_request POST "/api/chat" '{"userId":"user-sub-chat","question":"With subscription"}')
check_response "$RESPONSE" "usedQuotaType" "SUBSCRIPTION" "Should use SUBSCRIPTION quota"
check_response "$RESPONSE" "subscriptionId" "" "Should include subscriptionId"

print_test "Verify subscription usage is tracked"
RESPONSE=$(make_request GET "/api/subscriptions?userId=user-sub-chat")
check_response "$RESPONSE" "messagesUsed" "[1-9]" "Subscription messagesUsed should increment"

###############################################################################
# SECTION 5: SUBSCRIPTION CANCELLATION
###############################################################################

echo -e "\n${YELLOW}SECTION 5: SUBSCRIPTION CANCELLATION${NC}\n"

print_test "Cancel subscription - should disable auto-renew"
RESPONSE=$(make_request POST "/api/subscriptions/$BASIC_SUB_ID/cancel")
check_response "$RESPONSE" "autoRenew" "false" "Cancelled subscription should have autoRenew=false"
check_response "$RESPONSE" "status" "ACTIVE" "Should remain ACTIVE until end date"

print_test "Cancellation preserves usage history"
RESPONSE=$(make_request GET "/api/subscriptions?userId=user-sub-1")
check_response "$RESPONSE" "messagesUsed" "" "Cancelled subscription should preserve messagesUsed"

###############################################################################
# SECTION 6: ERROR HANDLING & VALIDATION
###############################################################################

echo -e "\n${YELLOW}SECTION 6: ERROR HANDLING & VALIDATION${NC}\n"

print_test "Validation: Missing userId in chat request"
RESPONSE=$(make_request POST "/api/chat" '{"question":"Test"}')
check_error "$RESPONSE" "VALIDATION_ERROR" "Should return VALIDATION_ERROR for missing userId"

print_test "Validation: Missing question in chat request"
RESPONSE=$(make_request POST "/api/chat" '{"userId":"test"}')
check_error "$RESPONSE" "VALIDATION_ERROR" "Should return VALIDATION_ERROR for missing question"

print_test "Error: Cancel non-existent subscription"
RESPONSE=$(make_request POST "/api/subscriptions/invalid-id-12345/cancel")
check_error "$RESPONSE" "NOT_FOUND" "Should return NOT_FOUND for invalid subscription ID"

###############################################################################
# SECTION 7: CHAT HISTORY
###############################################################################

echo -e "\n${YELLOW}SECTION 7: CHAT HISTORY${NC}\n"

print_test "Get chat history for user"
RESPONSE=$(make_request GET "/api/chat/history?userId=user-free-1")
check_response "$RESPONSE" "messages" "" "Should return messages array"

print_test "Chat history includes all required fields"
RESPONSE=$(make_request GET "/api/chat/history?userId=user-free-1&limit=1")
check_response "$RESPONSE" "question" "" "History should include question"
check_response "$RESPONSE" "answer" "" "History should include answer"
check_response "$RESPONSE" "tokensUsed" "" "History should include tokensUsed"

###############################################################################
# FINAL SUMMARY
###############################################################################

echo ""
echo "========================================"
echo "           TEST SUMMARY"
echo "========================================"
echo ""
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}\n"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}\n"
    exit 1
fi
