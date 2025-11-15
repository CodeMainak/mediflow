# MediFlow - Smart Healthcare Workflow & Patient Management System

A production-grade MERN stack application for managing healthcare workflows, patient records, appointments, prescriptions, and doctor-patient communication.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-20.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running with Docker](#running-with-docker)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Key Features Implemented](#key-features-implemented)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features
- **Role-Based Access Control** - Patient, Doctor, Receptionist, and Admin roles
- **Appointment Management** - Book, approve, reschedule, cancel appointments with status tracking
- **Medical Records** - Secure digital storage with file attachments
- **Prescription Management** - Digital prescriptions with medication details and dosage tracking
- **Real-Time Chat** - Socket.io powered messaging with typing indicators and read receipts
- **Patient Check-In** - Receptionist check-in system with timestamp tracking
- **Doctor Profiles** - Specializations, availability, and qualifications

### Advanced Features
- **Automated Appointment Reminders** - 24-hour and 1-hour reminders via email and SMS
- **Double-Booking Prevention** - Database-level constraints to prevent scheduling conflicts
- **Available Slots API** - Real-time slot availability checking
- **Dual-Channel Notifications** - Email (Gmail) and SMS (Twilio) notifications
- **Manual Reminder Trigger** - Doctors/admins can send immediate reminders
- **Bundle Optimization** - Code splitting and lazy loading for 60% faster load times
- **In-App Analytics** - Performance monitoring and user tracking
- **Admin Dashboard** - System statistics, user management, and activity logs

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Multi-tier protection (auth: 5/15min, API: 100/15min, messages: 30/1min)
- **Helmet Security** - CSP, HSTS, XSS protection
- **Password Encryption** - bcryptjs hashing
- **Input Validation** - Request validation and sanitization
- **CORS Protection** - Configured cross-origin access

## Tech Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js 5.1.0
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.io 4.7.4
- **Email:** Nodemailer (SMTP)
- **SMS:** Twilio (optional)
- **Scheduling:** node-cron
- **Security:** Helmet, express-rate-limit
- **File Upload:** Multer
- **Language:** TypeScript

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.3.5
- **Styling:** Tailwind CSS
- **UI Library:** Radix UI
- **Routing:** React Router 7.9.4
- **HTTP Client:** Axios
- **State Management:** Context API
- **Charts:** Recharts
- **Icons:** Lucide React

## Project Structure

```
mediflow/
├── mediflow-backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                 # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Appointment.ts
│   │   │   ├── Prescription.ts
│   │   │   ├── MedicalRecord.ts
│   │   │   ├── DoctorProfile.ts
│   │   │   └── Message.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── appointmentController.ts
│   │   │   ├── prescriptionController.ts
│   │   │   ├── medicalRecordController.ts
│   │   │   ├── doctorController.ts
│   │   │   ├── messageController.ts
│   │   │   └── adminController.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── appointmentRoutes.ts
│   │   │   ├── prescriptionRoutes.ts
│   │   │   ├── medicalRecordRoutes.ts
│   │   │   ├── doctorRoutes.ts
│   │   │   ├── messageRoutes.ts
│   │   │   └── adminRoutes.ts
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── uploadMiddleware.ts
│   │   │   └── securityMiddleware.ts
│   │   └── services/
│   │       ├── notificationService.ts
│   │       └── socketService.ts
│   ├── uploads/                      # File storage
│   ├── server.ts                     # Entry point
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── mediflow-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── appointments/
│   │   │   ├── prescriptions/
│   │   │   ├── patients/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── appointmentService.js
│   │   │   └── recordService.js
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- MongoDB 7.0 or higher (local or Atlas)
- npm or yarn
- Git

### Installation

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mediflow
```

#### 2. Backend Setup

```bash
cd mediflow-backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mediflow
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Gmail Setup (Required for Email Notifications):**
1. Enable 2-Factor Authentication in your Google Account
2. Go to Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Use the 16-digit password in `EMAIL_PASSWORD`

**Twilio Setup (Optional for SMS):**
- Sign up at [twilio.com](https://www.twilio.com) - Free $15 credit
- Get credentials from dashboard and add to `.env`
- If not configured, SMS will be automatically disabled

Start the server:
```bash
npm run dev
```

The backend will start on `http://localhost:8000`

**Features Enabled:**
- ✅ Automated appointment reminders (24h and 1h before)
- ✅ Email + SMS notifications (SMS optional)
- ✅ Rate limiting and security
- ✅ Real-time messaging via Socket.io

#### 3. Frontend Setup

```bash
cd mediflow-frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Run in development mode
npm run dev
```

The frontend will start on `http://localhost:3000`

### Running with Docker

The easiest way to run the entire stack:

```bash
# From the project root directory
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- MongoDB on port 27017
- Backend API on port 8000
- Frontend on port 3000

## Environment Variables

### Backend (.env)

```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mediflow
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**Note:** Twilio variables are optional. If not configured, SMS notifications will be disabled automatically.

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:8000
```

## API Endpoints

### Quick API Overview

- **Authentication:** `/api/auth/*` - Register, login, get current user
- **Appointments:** `/api/appointments/*` - CRUD, check-in, available slots, reminders
- **Prescriptions:** `/api/prescriptions/*` - Create, view, update prescriptions
- **Medical Records:** `/api/medical-records/*` - Patient medical history
- **Messaging:** `/api/messages/*` - Real-time chat, conversations, unread count
- **Notifications:** `/api/notifications/*` - In-app notifications, manual reminders
- **Admin:** `/api/admin/*` - User management, system statistics
- **Doctors:** `/api/doctors/*` - List doctors, view profiles
- **Health Check:** `/api/health` - Server health status

### Key Endpoints

**Appointment Reminders:**
- `POST /api/notifications/send-reminder/:appointmentId` - Manual reminder (Doctor/Admin)

**Available Slots:**
- `GET /api/appointments/available-slots?doctorId=X&date=Y` - Real-time availability

**Check-In:**
- `PATCH /api/appointments/:id/checkin` - Patient check-in (Receptionist/Admin)

## User Roles

### 1. Patient
- Register and login
- Book appointments with doctors
- View prescriptions and medical records
- Chat with doctors
- Manage profile

### 2. Doctor
- Approve/reject/reschedule appointments
- Create prescriptions and medical records
- Upload medical reports
- Chat with patients
- View patient history

### 3. Receptionist
- Manage appointments
- Register patients
- View schedules

### 4. Admin
- Manage all users (CRUD operations)
- View system statistics
- Monitor activity logs
- Access all system features

## Key Features Implemented

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcryptjs
- ✅ Protected routes
- ✅ Rate-limited login (5 attempts per 15 minutes)

### Appointment System
- ✅ Create appointments with doctor selection
- ✅ Approve/reject by doctor
- ✅ Reschedule functionality
- ✅ Patient check-in with timestamp
- ✅ Multi-status workflow tracking
- ✅ Double-booking prevention
- ✅ Available time slots API
- ✅ Automated reminders (24h and 1h before)

### Medical Records
- ✅ Digital record keeping
- ✅ File attachments support
- ✅ Diagnosis and prescription tracking
- ✅ Visit history
- ✅ Doctor-created records

### Real-Time Features
- ✅ Socket.io integration
- ✅ Live messaging
- ✅ Online user tracking
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Unread message count

### Notifications & Reminders
- ✅ Email notifications (Gmail SMTP)
- ✅ SMS notifications (Twilio, optional)
- ✅ Automated 24-hour reminders
- ✅ Automated 1-hour reminders
- ✅ Manual reminder trigger
- ✅ Appointment confirmations
- ✅ Welcome emails
- ✅ In-app notifications

### Admin Features
- ✅ User management (CRUD)
- ✅ System statistics dashboard
- ✅ Activity monitoring
- ✅ Role management
- ✅ Appointment overview

### Performance & Optimization
- ✅ Code splitting and lazy loading
- ✅ Bundle optimization (60% reduction)
- ✅ Performance monitoring
- ✅ Analytics tracking
- ✅ Caching utilities

## Security Features

- ✅ **Helmet** - Security headers
- ✅ **Rate Limiting** - DDoS protection
  - Auth endpoints: 5 requests/15 min
  - API endpoints: 100 requests/15 min
  - File uploads: 20 uploads/hour
  - Messages: 30 messages/min
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **JWT** - Secure token-based auth
- ✅ **Password Hashing** - bcryptjs encryption
- ✅ **Input Validation** - express-validator
- ✅ **File Type Validation** - Restricted uploads

## Deployment

### Option 1: Docker Compose (Recommended for Quick Setup)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd mediflow

# 2. Create .env file with your credentials
cat > .env << EOF
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://your-domain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
EOF

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

Access your application:
- Frontend: `http://localhost` (port 80)
- Backend API: `http://localhost:8000`
- MongoDB: `localhost:27017`

### Option 2: AWS EC2 Deployment

#### Step 1: Launch EC2 Instance

1. Open AWS Console → EC2 → Launch Instance
2. Configuration:
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** t3.medium (2 vCPU, 4GB RAM)
   - **Storage:** 30GB gp3
   - **Security Group:** Open ports 22, 80, 443, 8000

#### Step 2: Connect and Install Docker

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
exit
```

#### Step 3: Deploy Application

```bash
# Reconnect and clone repository
ssh -i your-key.pem ubuntu@your-ec2-ip
git clone <your-repo-url>
cd mediflow

# Create environment variables
nano .env
# Add your environment variables (see docker-compose example above)

# Start services
docker-compose up -d

# Verify deployment
curl http://localhost:8000/api/health
```

#### Step 4: Setup Domain and SSL (Optional)

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/mediflow
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/mediflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 3: AWS ECS with Fargate

#### Step 1: Push Images to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name mediflow-backend
aws ecr create-repository --repository-name mediflow-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd mediflow-backend
docker build -t mediflow-backend .
docker tag mediflow-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-backend:latest

# Build and push frontend
cd ../mediflow-frontend
docker build -t mediflow-frontend .
docker tag mediflow-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-frontend:latest
```

#### Step 2: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (restrict in production)
5. Get connection string

#### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name mediflow-cluster

# Create log groups
aws logs create-log-group --log-group-name /ecs/mediflow-backend
aws logs create-log-group --log-group-name /ecs/mediflow-frontend
```

#### Step 4: Create Task Definitions

Use AWS Console → ECS → Task Definitions → Create:

**Backend Task:**
- Container image: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-backend:latest`
- CPU: 512, Memory: 1024
- Port: 8000
- Environment variables: Add all backend env vars

**Frontend Task:**
- Container image: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mediflow-frontend:latest`
- CPU: 256, Memory: 512
- Port: 80

#### Step 5: Create Load Balancer and Services

1. Create Application Load Balancer
2. Create target groups (backend: port 8000, frontend: port 80)
3. Create ECS services using Fargate
4. Configure auto-scaling (optional)

### Maintenance

```bash
# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart

# Update application
git pull
docker-compose up -d --build

# Backup MongoDB
docker exec mediflow-mongodb mongodump --out /data/backup
docker cp mediflow-mongodb:/data/backup ./backup-$(date +%Y%m%d)

# Scale services (ECS)
aws ecs update-service --cluster mediflow-cluster --service backend --desired-count 3
```

### Database (MongoDB Atlas)

1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update `MONGO_URI` in .env

## Automated Appointment Reminders

The system automatically sends appointment reminders via email and SMS:

**24-Hour Reminder:**
- Runs every hour
- Checks for appointments 23-24 hours away
- Sends email + SMS to patient

**1-Hour Reminder:**
- Runs every 10 minutes
- Checks for appointments 50-60 minutes away
- Sends email + SMS to patient

**Manual Reminder:**
- Doctors/Admins can trigger immediate reminders
- API: `POST /api/notifications/send-reminder/:appointmentId`

**Notification Channels:**
- **Email:** Always enabled (via Gmail SMTP)
- **SMS:** Optional (via Twilio) - automatically disabled if not configured

**Example Timeline:**
```
Nov 10, 2025 at 2:00 PM - Appointment scheduled

Nov 9, 2:00 PM → 24-hour reminder sent (Email + SMS)
Nov 10, 1:00 PM → 1-hour reminder sent (Email + SMS)
Nov 10, 2:00 PM → Appointment time
```

## Scripts

### Backend

```bash
npm run dev      # Development mode with hot reload
```

### Frontend

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Demo Credentials

### Patient
- Email: patient@test.com
- Password: password123

### Doctor
- Email: doctor@test.com
- Password: password123

### Admin
- Email: admin@test.com
- Password: password123

## Future Enhancements

- [ ] Video consultation integration
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Telemedicine features
- [ ] Lab test integration
- [ ] Pharmacy integration

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - Mainak Mondal
Email: mainakmondal33@gmail.com

Project Link: [https://github.com/yourusername/mediflow](https://github.com/yourusername/mediflow)

---

**Made with ❤️ using MERN Stack**
