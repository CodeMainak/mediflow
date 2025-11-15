#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MediFlow AWS Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Please install Terraform: https://www.terraform.io/downloads"
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo -e "${YELLOW}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${YELLOW}AWS Region: ${AWS_REGION}${NC}"

# Navigate to project root
cd "$(dirname "$0")/../.."

# Step 1: Build and push Docker images
echo -e "\n${GREEN}Step 1: Building and pushing Docker images...${NC}"

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories if they don't exist
echo "Creating ECR repositories if they don't exist..."
aws ecr describe-repositories --repository-names mediflow-backend --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name mediflow-backend --region $AWS_REGION

aws ecr describe-repositories --repository-names mediflow-frontend --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name mediflow-frontend --region $AWS_REGION

# Build and push backend
echo -e "${YELLOW}Building backend Docker image...${NC}"
docker build -t mediflow-backend:latest ./mediflow-backend
docker tag mediflow-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-backend:latest
echo -e "${YELLOW}Pushing backend image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-backend:latest

# Build and push frontend
echo -e "${YELLOW}Building frontend Docker image...${NC}"
docker build -t mediflow-frontend:latest ./mediflow-frontend
docker tag mediflow-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-frontend:latest
echo -e "${YELLOW}Pushing frontend image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-frontend:latest

echo -e "${GREEN}✓ Docker images built and pushed successfully${NC}"

# Step 2: Deploy infrastructure with Terraform
echo -e "\n${GREEN}Step 2: Deploying infrastructure with Terraform...${NC}"

cd aws-deployment/terraform

# Initialize Terraform if not already initialized
if [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    terraform init
fi

# Plan
echo -e "${YELLOW}Running Terraform plan...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
echo -e "\n${YELLOW}Do you want to apply these changes? (yes/no)${NC}"
read -r response
if [ "$response" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# Apply
echo -e "${YELLOW}Applying Terraform configuration...${NC}"
terraform apply tfplan

# Get outputs
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

ALB_DNS=$(terraform output -raw alb_dns_name)
echo -e "${YELLOW}Application URL: http://${ALB_DNS}${NC}"
echo -e "${YELLOW}Backend API: http://${ALB_DNS}/api${NC}"

echo -e "\n${YELLOW}Note: It may take a few minutes for the services to be fully healthy.${NC}"
echo -e "${YELLOW}You can check the status in the AWS ECS console.${NC}"

cd ../..
