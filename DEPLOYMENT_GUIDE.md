# MediFlow - Docker Deployment Guide (AWS EC2)

This guide will help you deploy MediFlow (Frontend + Backend + MongoDB) on AWS EC2 using Docker Compose.

## Prerequisites

- AWS Account (Free tier eligible)
- Basic terminal/command line knowledge
- Domain name (optional, but recommended for resume)

## Estimated Cost

- **Free Tier**: $0/month for first 12 months (t2.micro or t3.micro)
- **After Free Tier**: ~$10-20/month (t3.small recommended)

---

## Part 1: AWS EC2 Setup (20 minutes)

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to EC2**: Search for "EC2" in the services search bar
3. **Click "Launch Instance"**

### Step 2: Configure Instance

**Name and Tags:**
- Name: `mediflow-production`

**Application and OS Images (AMI):**
- Select: **Ubuntu Server 22.04 LTS** (Free tier eligible)

**Instance Type:**
- Free tier: `t2.micro` (1GB RAM - minimum)
- Recommended: `t3.small` (2GB RAM - better performance) - ~$15/month

**Key Pair:**
- Click "Create new key pair"
- Name: `mediflow-key`
- Type: RSA
- Format: `.pem` (Mac/Linux) or `.ppk` (Windows)
- **IMPORTANT**: Download and save this file securely - you can't download it again!

**Network Settings:**
- Click "Edit"
- **Firewall (Security Group)**: Create new security group
- Name: `mediflow-sg`
- Description: `Security group for MediFlow application`

**Add the following rules:**

| Type        | Port Range | Source      | Description           |
|-------------|------------|-------------|-----------------------|
| SSH         | 22         | My IP       | SSH access            |
| HTTP        | 80         | 0.0.0.0/0   | Frontend access       |
| HTTPS       | 443        | 0.0.0.0/0   | HTTPS (future)        |
| Custom TCP  | 8000       | 0.0.0.0/0   | Backend API           |

**Configure Storage:**
- Size: **20 GB** (minimum) - 30 GB recommended
- Type: gp3 (General Purpose SSD)

### Step 3: Launch Instance

- Review your configuration
- Click **"Launch Instance"**
- Wait 2-3 minutes for the instance to start

### Step 4: Get Your Server IP

1. Click on your instance ID
2. Copy the **Public IPv4 address** (e.g., 3.110.123.45)
3. Save this - you'll need it!

---

## Part 2: Connect to Your Server (5 minutes)

### For Mac/Linux:

```bash
# Move your key to a safe location
mkdir -p ~/.ssh
mv ~/Downloads/mediflow-key.pem ~/.ssh/
chmod 400 ~/.ssh/mediflow-key.pem

# Connect to server (replace with YOUR IP)
ssh -i ~/.ssh/mediflow-key.pem ubuntu@YOUR_SERVER_IP
```

### For Windows:

**Option 1: Using Git Bash**
```bash
chmod 400 /path/to/mediflow-key.pem
ssh -i /path/to/mediflow-key.pem ubuntu@YOUR_SERVER_IP
```

**Option 2: Using PuTTY**
- Convert .pem to .ppk using PuTTYgen
- Use PuTTY to connect with the .ppk file

---

## Part 3: Install Docker on Server (10 minutes)

Once connected to your server, run these commands:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (to run docker without sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# IMPORTANT: Logout and login again for group changes to take effect
exit
```

**Reconnect to server:**
```bash
ssh -i ~/.ssh/mediflow-key.pem ubuntu@YOUR_SERVER_IP
```

---

## Part 4: Deploy Your Application (15 minutes)

### Step 1: Transfer Your Code to Server

**Option A: Using Git (Recommended)**

```bash
# On your server
cd ~
git clone https://github.com/YOUR_USERNAME/mediflow.git
cd mediflow
```

**Option B: Using SCP (if not using Git)**

```bash
# On your LOCAL machine (new terminal)
cd /Users/mainakmondal/work/mediflow
tar -czf mediflow.tar.gz .
scp -i ~/.ssh/mediflow-key.pem mediflow.tar.gz ubuntu@YOUR_SERVER_IP:~

# Back on server
tar -xzf mediflow.tar.gz
cd mediflow
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

**Update these critical values:**

```bash
# Generate secure passwords
MONGO_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

# Set your server IP (replace with YOUR actual IP)
FRONTEND_URL=http://YOUR_SERVER_IP
```

**Example .env:**
```
NODE_ENV=production
MONGO_USERNAME=admin
MONGO_PASSWORD=xK9mP2nQ5vR8sT1wY4zA7bC0dE3fG6hJ
JWT_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3
FRONTEND_URL=http://3.110.123.45
PORT=8000
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 3: Build and Start Services

```bash
# Build Docker images (this takes 5-10 minutes first time)
docker-compose build

# Start all services in background
docker-compose up -d

# Check if containers are running
docker-compose ps
```

You should see 3 services running:
- `mediflow-mongodb`
- `mediflow-backend`
- `mediflow-frontend`

### Step 4: Verify Deployment

```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Press Ctrl+C to exit logs

# Check container health
docker ps
```

---

## Part 5: Access Your Application

### Frontend (User Interface)
```
http://YOUR_SERVER_IP
```

### Backend API
```
http://YOUR_SERVER_IP:8000/api
```

### Health Check
```
curl http://YOUR_SERVER_IP:8000/api/health
```

---

## Part 6: Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

### Update Application After Code Changes
```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or in one command
docker-compose up -d --build
```

### Monitor Resources
```bash
# Container resource usage
docker stats

# Disk space
df -h

# Check MongoDB data
docker exec -it mediflow-mongodb mongosh -u admin -p YOUR_MONGO_PASSWORD --authenticationDatabase admin
```

---

## Part 7: Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker-compose logs backend

# Check if ports are already in use
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :80
```

### MongoDB connection issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is running
docker exec -it mediflow-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Frontend can't connect to backend
```bash
# Verify FRONTEND_URL in .env matches your server IP
cat .env | grep FRONTEND_URL

# Restart backend after .env changes
docker-compose restart backend
```

### Out of disk space
```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune
```

---

## Part 8: (Optional) Set Up Domain Name

### If you have a domain (e.g., mediflow.yourdomain.com):

1. **Add DNS A Record**:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add A record: `mediflow` → `YOUR_SERVER_IP`
   - Wait 5-10 minutes for DNS propagation

2. **Update Environment**:
   ```bash
   nano .env
   # Change: FRONTEND_URL=http://mediflow.yourdomain.com
   ```

3. **Restart services**:
   ```bash
   docker-compose restart backend
   ```

4. **Access via domain**:
   ```
   http://mediflow.yourdomain.com
   ```

### (Advanced) Set Up SSL/HTTPS with Let's Encrypt

See the `SSL_SETUP.md` file for detailed instructions on setting up free SSL certificates.

---

## Part 9: Monitoring & Maintenance

### Enable Automatic Container Restart
All services are configured with `restart: unless-stopped` in docker-compose.yml
This means containers will automatically restart after server reboots.

### Backup MongoDB Data
```bash
# Create backup
docker exec mediflow-mongodb mongodump --out /data/backup -u admin -p YOUR_MONGO_PASSWORD --authenticationDatabase admin

# Copy backup to host
docker cp mediflow-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)

# Download to local machine
scp -i ~/.ssh/mediflow-key.pem -r ubuntu@YOUR_SERVER_IP:~/mediflow/mongodb-backup-* ./
```

### Set Up Automatic Backups (Cron Job)
```bash
# Create backup script
nano ~/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec mediflow-mongodb mongodump --out /data/backup -u admin -p YOUR_MONGO_PASSWORD --authenticationDatabase admin
docker cp mediflow-mongodb:/data/backup $BACKUP_DIR/mongodb-$DATE

# Keep only last 7 backups
ls -t $BACKUP_DIR | tail -n +8 | xargs -I {} rm -rf $BACKUP_DIR/{}
```

```bash
# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ubuntu/backup.sh
```

---

## Part 10: Security Best Practices

### 1. Update Security Group
- Change SSH source from "0.0.0.0/0" to "My IP" for better security

### 2. Enable Ubuntu Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 3. Keep System Updated
```bash
# Run weekly
sudo apt update && sudo apt upgrade -y
```

### 4. Change Default Passwords
- Ensure you've set strong MONGO_PASSWORD and JWT_SECRET in .env

### 5. Limit Backend API Access (Optional)
If you don't need direct API access, remove port 8000 from security group.
Frontend nginx will proxy all API requests.

---

## Cost Optimization

### Free Tier (12 months)
- Use **t2.micro** instance
- 20 GB storage
- **Cost**: $0/month

### After Free Tier
- Upgrade to **t3.small** (2GB RAM) - ~$15/month
- Or keep t2.micro and add swap memory (slower but free)

### Add Swap Memory (for t2.micro)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Next Steps

1. **Test your application** thoroughly
2. **Set up monitoring** (CloudWatch, Grafana)
3. **Configure HTTPS** (Let's Encrypt - SSL_SETUP.md)
4. **Set up CI/CD** (GitHub Actions for auto-deployment)
5. **Add custom domain**
6. **Set up email notifications**

---

## For Your Resume

### What to Highlight:

**Project**: MediFlow - Healthcare Workflow Management System

**Technologies**:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Socket.io
- **DevOps**: Docker, Docker Compose, AWS EC2, Nginx
- **Security**: JWT Authentication, Helmet, Rate Limiting

**Deployment Architecture**:
- Containerized microservices using Docker
- Deployed on AWS EC2 with multi-container orchestration
- Nginx reverse proxy for API and WebSocket routing
- MongoDB for persistent data storage
- Production-grade security headers and CORS configuration

**Key Achievements**:
- Deployed full-stack MERN application on AWS cloud infrastructure
- Implemented Docker containerization for consistent development and production environments
- Configured Nginx reverse proxy for efficient request routing and load balancing
- Set up real-time communication using WebSocket (Socket.io)
- Implemented automated container health checks and restart policies

**Live Demo**: http://YOUR_SERVER_IP

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this guide's troubleshooting section
- Check application README.md for feature documentation

---

**Congratulations!** Your MediFlow application is now live on AWS! 🎉
