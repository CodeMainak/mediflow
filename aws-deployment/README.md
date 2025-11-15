# MediFlow AWS Deployment Guide

This guide will help you deploy the MediFlow application to AWS using Docker containers, ECS (Elastic Container Service), and Terraform for infrastructure as code.

## Architecture Overview

The deployment architecture includes:

- **Amazon ECS Fargate**: Serverless container orchestration
- **Application Load Balancer (ALB)**: Distributes traffic to frontend and backend services
- **Amazon ECR**: Docker container registry for storing images
- **Amazon EFS**: Persistent storage for MongoDB data
- **Amazon S3**: File storage for uploads
- **VPC**: Isolated network with public and private subnets across 2 availability zones
- **CloudWatch**: Centralized logging and monitoring
- **Auto Scaling**: Automatic scaling based on CPU utilization

### Architecture Diagram

```
Internet → ALB → Frontend (ECS Fargate) → Backend (ECS Fargate) → MongoDB (ECS Fargate)
                                                                   → EFS (Data)
                                                                   → S3 (Uploads)
```

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **Docker** installed
4. **Terraform** (v1.0+) installed
5. **Git** (for version control)

## Cost Estimate

Expected monthly AWS costs (approximate):
- ECS Fargate: $40-80/month (depending on usage)
- Application Load Balancer: $20-25/month
- EFS: $5-15/month
- S3: $1-5/month (depending on uploads)
- Data Transfer: Variable
- **Total: ~$70-130/month**

Free Tier eligible services can reduce initial costs.

## Deployment Steps

### Step 1: Clone and Navigate to Project

```bash
cd /path/to/mediflow
```

### Step 2: Configure Terraform Variables

1. Copy the example variables file:
   ```bash
   cd aws-deployment/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your configuration:
   ```hcl
   aws_region  = "us-east-1"
   environment = "production"

   # IMPORTANT: Change these values!
   mongo_username = "admin"
   mongo_password = "your-secure-password-here"
   jwt_secret     = "your-jwt-secret-here"

   # Optional: Email configuration
   email_user     = "your-email@gmail.com"
   email_password = "your-app-password"

   # Optional: Twilio configuration
   twilio_account_sid   = "your-twilio-sid"
   twilio_auth_token    = "your-twilio-token"
   twilio_phone_number  = "+1234567890"
   ```

### Step 3: Deploy Using Automated Script

The easiest way to deploy is using the automated script:

```bash
cd ../..  # Return to project root
./aws-deployment/scripts/deploy.sh
```

This script will:
1. Build Docker images for frontend and backend
2. Push images to Amazon ECR
3. Deploy infrastructure using Terraform
4. Output your application URL

### Step 4: Access Your Application

After deployment completes, you'll see output like:

```
Application URL: http://mediflow-alb-xxxxxxxxxx.us-east-1.elb.amazonaws.com
Backend API: http://mediflow-alb-xxxxxxxxxx.us-east-1.elb.amazonaws.com/api
```

Visit the URL in your browser to access MediFlow!

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Build and Push Docker Images

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name mediflow-backend --region $AWS_REGION
aws ecr create-repository --repository-name mediflow-frontend --region $AWS_REGION

# Build and push backend
docker build -t mediflow-backend:latest ./mediflow-backend
docker tag mediflow-backend:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-backend:latest

# Build and push frontend
docker build -t mediflow-frontend:latest ./mediflow-frontend
docker tag mediflow-frontend:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mediflow-frontend:latest
```

### 2. Deploy with Terraform

```bash
cd aws-deployment/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### 3. Get Application URL

```bash
terraform output alb_url
```

## Updating Your Application

### Update Backend or Frontend

To deploy new code changes:

```bash
# Update backend
./aws-deployment/scripts/update-service.sh backend

# Update frontend
./aws-deployment/scripts/update-service.sh frontend
```

This will build a new Docker image, push it to ECR, and trigger a rolling deployment.

### Update Infrastructure

If you modify Terraform files:

```bash
cd aws-deployment/terraform
terraform plan
terraform apply
```

## Monitoring and Debugging

### View Logs

1. **AWS Console**: Navigate to CloudWatch → Log Groups
   - `/ecs/mediflow-backend`
   - `/ecs/mediflow-frontend`
   - `/ecs/mediflow-mongodb`

2. **CLI**:
   ```bash
   aws logs tail /ecs/mediflow-backend --follow
   ```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster mediflow-cluster \
  --services mediflow-backend mediflow-frontend \
  --region us-east-1
```

### Connect to Running Container

```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster mediflow-cluster \
  --service-name mediflow-backend \
  --region us-east-1 \
  --query 'taskArns[0]' --output text)

# Execute command
aws ecs execute-command \
  --cluster mediflow-cluster \
  --task $TASK_ARN \
  --container backend \
  --command "/bin/sh" \
  --interactive
```

## Scaling

### Manual Scaling

```bash
aws ecs update-service \
  --cluster mediflow-cluster \
  --service mediflow-backend \
  --desired-count 4 \
  --region us-east-1
```

### Auto Scaling

Auto scaling is pre-configured based on CPU utilization:
- **Target CPU**: 70%
- **Min Instances**: 2
- **Max Instances**: 4

Modify in `terraform/ecs-services.tf` if needed.

## Security Best Practices

1. **Change Default Credentials**: Update MongoDB password and JWT secret
2. **Use Secrets Manager**: Store sensitive data in AWS Secrets Manager (not environment variables)
3. **Enable HTTPS**: Add ACM certificate and configure HTTPS listener
4. **Restrict Security Groups**: Limit access to trusted IPs
5. **Enable VPC Flow Logs**: Monitor network traffic
6. **Regular Updates**: Keep Docker images and dependencies updated

## Custom Domain Setup

To use a custom domain (e.g., app.yourdomain.com):

1. **Register domain** in Route 53 or your DNS provider
2. **Request SSL certificate** in AWS Certificate Manager
3. **Update Terraform**:
   ```hcl
   # In terraform.tfvars
   domain_name = "app.yourdomain.com"
   ```
4. **Add HTTPS listener** in `alb.tf`:
   ```hcl
   resource "aws_lb_listener" "https" {
     load_balancer_arn = aws_lb.main.arn
     port              = 443
     protocol          = "HTTPS"
     certificate_arn   = var.certificate_arn

     default_action {
       type             = "forward"
       target_group_arn = aws_lb_target_group.frontend.arn
     }
   }
   ```
5. **Create Route 53 record** pointing to ALB

## Backup and Disaster Recovery

### MongoDB Backups

EFS automatically provides durability. For additional backups:

```bash
# Create manual backup
aws ecs execute-command \
  --cluster mediflow-cluster \
  --task <mongodb-task-arn> \
  --container mongodb \
  --command "mongodump --out /data/backup" \
  --interactive
```

Consider setting up:
- AWS Backup for automated EFS snapshots
- Cross-region replication for S3 uploads

## Destroying Infrastructure

⚠️ **WARNING**: This will delete ALL resources and data!

```bash
./aws-deployment/scripts/destroy.sh
```

Or manually:

```bash
cd aws-deployment/terraform
terraform destroy
```

## Troubleshooting

### Services Not Starting

1. Check CloudWatch logs for errors
2. Verify ECR images are pushed successfully
3. Ensure security groups allow traffic
4. Check task definitions for correct environment variables

### Database Connection Issues

1. Verify MongoDB service is running
2. Check service discovery DNS resolution
3. Verify credentials in backend environment variables

### High Costs

1. Review CloudWatch metrics for unused resources
2. Consider using Fargate Spot for non-critical services
3. Reduce desired task counts during low-traffic periods
4. Enable S3 lifecycle policies for old uploads

## Resume-Worthy Talking Points

When showcasing this deployment on your resume:

✅ **Infrastructure as Code**: "Automated AWS infrastructure deployment using Terraform, managing VPC, ECS, ALB, and security groups"

✅ **Containerization**: "Dockerized full-stack application with multi-stage builds for optimized production images"

✅ **Cloud Architecture**: "Designed and deployed highly available architecture across multiple availability zones with auto-scaling"

✅ **CI/CD**: "Implemented automated deployment scripts for seamless updates to containerized services"

✅ **Monitoring**: "Configured centralized logging with CloudWatch and implemented health checks for all services"

✅ **Security**: "Implemented security best practices including VPC isolation, security groups, encrypted storage, and IAM roles"

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS ECS console for service status
3. Verify Terraform state is consistent
4. Check this documentation for common issues

---

**Good luck with your deployment! 🚀**
