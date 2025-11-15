# EFS File System for MongoDB Data
resource "aws_efs_file_system" "mongodb" {
  creation_token = "${var.project_name}-mongodb-efs"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"

  tags = {
    Name = "${var.project_name}-mongodb-efs"
  }
}

# EFS Mount Targets
resource "aws_efs_mount_target" "mongodb" {
  count           = var.azs_count
  file_system_id  = aws_efs_file_system.mongodb.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

# Security Group for EFS
resource "aws_security_group" "efs" {
  name        = "${var.project_name}-efs-sg"
  description = "Security group for EFS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "NFS from MongoDB containers"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.mongodb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-efs-sg"
  }
}

# EFS Access Point for MongoDB
resource "aws_efs_access_point" "mongodb" {
  file_system_id = aws_efs_file_system.mongodb.id

  posix_user {
    gid = 999
    uid = 999
  }

  root_directory {
    path = "/mongodb"
    creation_info {
      owner_gid   = 999
      owner_uid   = 999
      permissions = "755"
    }
  }

  tags = {
    Name = "${var.project_name}-mongodb-efs-ap"
  }
}
