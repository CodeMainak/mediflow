variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mediflow"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# MongoDB Configuration
variable "mongo_username" {
  description = "MongoDB root username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "mongo_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "backend_cpu" {
  description = "CPU units for backend container (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory for backend container in MB"
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "CPU units for frontend container"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for frontend container in MB"
  type        = number
  default     = 512
}

variable "mongodb_cpu" {
  description = "CPU units for MongoDB container"
  type        = number
  default     = 512
}

variable "mongodb_memory" {
  description = "Memory for MongoDB container in MB"
  type        = number
  default     = 1024
}

# Optional Email Configuration
variable "email_user" {
  description = "Email user for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "email_password" {
  description = "Email password for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

# Optional Twilio Configuration
variable "twilio_account_sid" {
  description = "Twilio account SID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio auth token"
  type        = string
  default     = ""
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio phone number"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}
