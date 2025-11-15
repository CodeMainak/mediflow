#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICE_NAME=$1
AWS_REGION=${AWS_REGION:-us-east-1}

if [ -z "$SERVICE_NAME" ]; then
    echo -e "${RED}Usage: $0 <backend|frontend>${NC}"
    exit 1
fi

if [ "$SERVICE_NAME" != "backend" ] && [ "$SERVICE_NAME" != "frontend" ]; then
    echo -e "${RED}Error: Service must be either 'backend' or 'frontend'${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Updating ${SERVICE_NAME} service${NC}"
echo -e "${GREEN}========================================${NC}"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Navigate to project root
cd "$(dirname "$0")/../.."

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push new image
echo -e "${YELLOW}Building ${SERVICE_NAME} Docker image...${NC}"
docker build -t mediflow-${SERVICE_NAME}:latest ./mediflow-${SERVICE_NAME}
docker tag mediflow-${SERVICE_NAME}:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-${SERVICE_NAME}:latest

echo -e "${YELLOW}Pushing ${SERVICE_NAME} image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-${SERVICE_NAME}:latest

# Force new deployment
echo -e "${YELLOW}Forcing new deployment of ${SERVICE_NAME} service...${NC}"
aws ecs update-service \
    --cluster mediflow-cluster \
    --service mediflow-${SERVICE_NAME} \
    --force-new-deployment \
    --region $AWS_REGION

echo -e "${GREEN}✓ ${SERVICE_NAME} service update initiated${NC}"
echo -e "${YELLOW}Monitor the deployment progress in the AWS ECS console${NC}"
