# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-backend-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.project_name}-frontend"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-frontend-logs"
  }
}

resource "aws_cloudwatch_log_group" "mongodb" {
  name              = "/ecs/${var.project_name}-mongodb"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-mongodb-logs"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# MongoDB Task Definition
resource "aws_ecs_task_definition" "mongodb" {
  family                   = "${var.project_name}-mongodb"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.mongodb_cpu
  memory                   = var.mongodb_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  volume {
    name = "mongodb-data"

    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.mongodb.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.mongodb.id
        iam             = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([{
    name      = "mongodb"
    image     = "mongo:7.0"
    essential = true

    portMappings = [{
      containerPort = 27017
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "MONGO_INITDB_ROOT_USERNAME"
        value = var.mongo_username
      },
      {
        name  = "MONGO_INITDB_ROOT_PASSWORD"
        value = var.mongo_password
      },
      {
        name  = "MONGO_INITDB_DATABASE"
        value = "mediflow"
      }
    ]

    mountPoints = [{
      sourceVolume  = "mongodb-data"
      containerPath = "/data/db"
      readOnly      = false
    }]

    healthCheck = {
      command     = ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 40
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.mongodb.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "mongodb"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-mongodb-task"
  }
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "PORT"
        value = "8000"
      },
      {
        name  = "NODE_ENV"
        value = var.environment
      },
      {
        name  = "MONGO_URI"
        value = "mongodb://${var.mongo_username}:${var.mongo_password}@${aws_service_discovery_service.mongodb.name}.${aws_service_discovery_private_dns_namespace.main.name}:27017/mediflow?authSource=admin"
      },
      {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      },
      {
        name  = "FRONTEND_URL"
        value = "http://${aws_lb.main.dns_name}"
      },
      {
        name  = "EMAIL_USER"
        value = var.email_user
      },
      {
        name  = "EMAIL_PASSWORD"
        value = var.email_password
      },
      {
        name  = "TWILIO_ACCOUNT_SID"
        value = var.twilio_account_sid
      },
      {
        name  = "TWILIO_AUTH_TOKEN"
        value = var.twilio_auth_token
      },
      {
        name  = "TWILIO_PHONE_NUMBER"
        value = var.twilio_phone_number
      }
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-backend-task"
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${aws_ecr_repository.frontend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    healthCheck = {
      command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "frontend"
      }
    }
  }])

  tags = {
    Name = "${var.project_name}-frontend-task"
  }
}
