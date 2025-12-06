#!/bin/bash
# Environment Variables Validation Script
# Run this before deployment to ensure all required variables are set

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Environment Variables Validation"
echo "=========================================="
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}✓ Loaded .env file${NC}"
else
    echo -e "${YELLOW}⚠ No .env file found, checking environment variables directly${NC}"
fi

ERRORS=0
WARNINGS=0

# Function to check required variable
check_required() {
    local var_name=$1
    local var_value="${!var_name}"
    local min_length=${2:-1}

    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ $var_name is not set (REQUIRED)${NC}"
        ERRORS=$((ERRORS + 1))
    elif [ ${#var_value} -lt $min_length ]; then
        echo -e "${RED}✗ $var_name is too short (min: $min_length chars)${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ $var_name is set${NC}"
    fi
}

# Function to check optional variable
check_optional() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}○ $var_name is not set (optional)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ $var_name is set${NC}"
    fi
}

# Function to validate URL format
check_url() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ $var_name is not set (REQUIRED)${NC}"
        ERRORS=$((ERRORS + 1))
    elif [[ ! "$var_value" =~ ^https?:// ]]; then
        echo -e "${RED}✗ $var_name is not a valid URL: $var_value${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ $var_name is valid URL${NC}"
    fi
}

# Function to validate email format
check_email() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ $var_name is not set (REQUIRED)${NC}"
        ERRORS=$((ERRORS + 1))
    elif [[ ! "$var_value" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${RED}✗ $var_name is not a valid email: $var_value${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ $var_name is valid email${NC}"
    fi
}

echo "--- Database Configuration ---"
check_required "DB_USER"
check_required "DB_PASSWORD" 8
check_required "DB_NAME"
check_optional "DB_SSLMODE"

echo ""
echo "--- Redis Configuration ---"
check_optional "REDIS_PASSWORD"

echo ""
echo "--- Meilisearch Configuration ---"
check_required "MEILI_MASTER_KEY" 16

echo ""
echo "--- MinIO Configuration ---"
check_required "MINIO_ACCESS_KEY" 3
check_required "MINIO_SECRET_KEY" 8
check_optional "MINIO_BUCKET_NAME"

echo ""
echo "--- JWT Configuration ---"
check_required "JWT_SECRET" 32
check_optional "JWT_ACCESS_EXPIRY"
check_optional "JWT_REFRESH_EXPIRY"

echo ""
echo "--- OAuth Configuration ---"
check_optional "GOOGLE_CLIENT_ID"
check_optional "GOOGLE_CLIENT_SECRET"
check_optional "GOOGLE_REDIRECT_URL"

echo ""
echo "--- Email Configuration ---"
check_optional "EMAIL_PROVIDER"
check_optional "RESEND_API_KEY"
check_optional "RESEND_FROM_EMAIL"

echo ""
echo "--- URLs Configuration ---"
check_url "FRONTEND_URL"
check_optional "ADMIN_FRONTEND_URL"
check_optional "NEXT_PUBLIC_API_URL"

echo ""
echo "--- Docker Images ---"
check_optional "BACKEND_IMAGE"
check_optional "FRONTEND_IMAGE"

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    echo -e "${YELLOW}○ $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${RED}Please fix the errors before deployment!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All required variables are set${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}○ $WARNINGS optional variable(s) not set${NC}"
    fi
    echo ""
    echo -e "${GREEN}Environment is ready for deployment!${NC}"
    exit 0
fi
