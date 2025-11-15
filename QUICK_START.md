# MediFlow - Quick Start Guide

This is a simplified guide to get your application running quickly on AWS EC2.

## Prerequisites
- AWS Account
- Credit/Debit card for AWS (free tier available)
- 1-2 hours of time

---

## Step-by-Step Deployment (50 minutes)

### 1. Launch AWS EC2 Instance (10 min)

1. Login to AWS Console: https://console.aws.amazon.com/
2. Search for "EC2" and click "Launch Instance"
3. Configure:
   - **Name**: `mediflow`
   - **OS**: Ubuntu 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t3.small ($15/month)
   - **Key Pair**: Create new → Download `.pem` file
   - **Security Group**: Allow ports 22, 80, 443, 8000
   - **Storage**: 20 GB
4. Click "Launch Instance"
5. Wait 2 minutes, then copy the **Public IP address**

### 2. Connect to Server (5 min)

**Mac/Linux:**
```bash
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_SERVER_IP
```

**Windows (Git Bash):**
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_SERVER_IP
```

### 3. Install Docker (10 min)

On the server, run:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt update
sudo apt install docker-compose -y

# Logout and login again
exit
```

Reconnect:
```bash
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_SERVER_IP
```

### 4. Upload Your Code (5 min)

**Option A - Using Git (Recommended):**
```bash
git clone https://github.com/YOUR_USERNAME/mediflow.git
cd mediflow
```

**Option B - Upload Files:**
```bash
# On your LOCAL machine
cd /Users/mainakmondal/work/mediflow
tar -czf mediflow.tar.gz .
scp -i ~/Downloads/your-key.pem mediflow.tar.gz ubuntu@YOUR_SERVER_IP:~

# Back on server
tar -xzf mediflow.tar.gz
cd mediflow
```

### 5. Configure Environment (5 min)

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Update these lines:
```bash
MONGO_PASSWORD=YourSecurePassword123!
JWT_SECRET=YourSecretKeyHere123456789012345
FRONTEND_URL=http://YOUR_SERVER_IP
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 6. Deploy Application (15 min)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh
```

Wait 5-10 minutes for build to complete.

### 7. Verify Deployment (2 min)

```bash
# Check status
./scripts/status.sh

# View logs
docker-compose logs -f
```

Press `Ctrl+C` to exit logs.

### 8. Access Your Application

Open browser:
- **Frontend**: `http://YOUR_SERVER_IP`
- **Backend**: `http://YOUR_SERVER_IP:8000/api`

---

## Common Commands

### View Logs
```bash
./scripts/logs.sh all        # All services
./scripts/logs.sh backend    # Backend only
./scripts/logs.sh frontend   # Frontend only
```

### Check Status
```bash
./scripts/status.sh
```

### Update Application
```bash
./scripts/update.sh
```

### Backup Database
```bash
./scripts/backup.sh
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Start Services
```bash
docker-compose up -d
```

---

## Troubleshooting

### "Cannot connect to application"
```bash
# Check if containers are running
docker-compose ps

# Check firewall
sudo ufw status

# Check logs for errors
docker-compose logs backend
```

### "Out of memory"
```bash
# Add swap memory (for t2.micro)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### "MongoDB connection error"
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### "Port already in use"
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000

# Kill the process or change port in docker-compose.yml
```

---

## Security Checklist

- [ ] Change default MongoDB password in `.env`
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Never commit `.env` file to Git
- [ ] Limit SSH access to your IP in AWS Security Group
- [ ] Set up automatic backups
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade -y`

---

## For Your Resume

### Live Demo URL
```
http://YOUR_SERVER_IP
```

### GitHub Repository
```
https://github.com/YOUR_USERNAME/mediflow
```

### Technologies Used
- Frontend: React, TypeScript, Tailwind CSS, Vite
- Backend: Node.js, Express, MongoDB, Socket.io
- DevOps: Docker, Docker Compose, AWS EC2, Nginx

### Key Achievements
- Deployed full-stack application on AWS using Docker
- Implemented microservices architecture with 3 containers
- Configured Nginx reverse proxy and load balancing
- Set up real-time WebSocket communication
- Implemented JWT authentication and security best practices

---

## Need More Help?

- **Detailed Guide**: See `DEPLOYMENT_GUIDE.md`
- **Resume Tips**: See `RESUME_PROJECT.md`
- **Application Features**: See `README.md`

---

## Maintenance

### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Backup database
./scripts/backup.sh

# Check disk space
df -h

# Check logs for errors
docker-compose logs --tail=100
```

### Monthly Tasks
```bash
# Clean up old Docker resources
docker system prune -a

# Review and test backups
ls -lh backups/

# Update Docker images
docker-compose pull
docker-compose up -d
```

---

**You're all set!** 🎉

Your MediFlow application is now running on AWS and ready to be added to your resume!
