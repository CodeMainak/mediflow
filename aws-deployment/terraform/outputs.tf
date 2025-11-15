output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "s3_uploads_bucket" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "mongodb_service_discovery_name" {
  description = "Service discovery name for MongoDB"
  value       = "${aws_service_discovery_service.mongodb.name}.${aws_service_discovery_private_dns_namespace.main.name}"
}

output "backend_service_discovery_name" {
  description = "Service discovery name for Backend"
  value       = "${aws_service_discovery_service.backend.name}.${aws_service_discovery_private_dns_namespace.main.name}"
}

output "cloudwatch_log_group_backend" {
  description = "CloudWatch log group for backend"
  value       = aws_cloudwatch_log_group.backend.name
}

output "cloudwatch_log_group_frontend" {
  description = "CloudWatch log group for frontend"
  value       = aws_cloudwatch_log_group.frontend.name
}
