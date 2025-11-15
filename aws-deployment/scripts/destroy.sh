#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}========================================${NC}"
echo -e "${RED}WARNING: DESTROY AWS INFRASTRUCTURE${NC}"
echo -e "${RED}========================================${NC}"

echo -e "${YELLOW}This will DELETE all AWS resources created by Terraform.${NC}"
echo -e "${YELLOW}This action CANNOT be undone!${NC}"
echo -e "\n${YELLOW}Are you absolutely sure? Type 'destroy' to confirm:${NC}"
read -r response

if [ "$response" != "destroy" ]; then
    echo -e "${GREEN}Destruction cancelled${NC}"
    exit 0
fi

cd "$(dirname "$0")/../terraform"

echo -e "${RED}Destroying infrastructure...${NC}"
terraform destroy -auto-approve

echo -e "${GREEN}✓ Infrastructure destroyed${NC}"
