# 🍼 Baby Day Book - Self-Hosting Guide

A complete step-by-step guide for beginners to set up Baby Day Book on a NAS, Linux PC, or home lab server.

---

## 📋 Table of Contents

1. [What You'll Need](#what-youll-need)
2. [Step 1: Install Required Software](#step-1-install-required-software)
3. [Step 2: Download the Code](#step-2-download-the-code)
4. [Step 3: Set Up MongoDB Database](#step-3-set-up-mongodb-database)
5. [Step 4: Set Up the Backend](#step-4-set-up-the-backend)
6. [Step 5: Set Up the Frontend](#step-5-set-up-the-frontend)
7. [Step 6: Configure Your Network](#step-6-configure-your-network)
8. [Step 7: Start Everything](#step-7-start-everything)
9. [Step 8: Auto-Start on Boot (Optional)](#step-8-auto-start-on-boot-optional)
10. [Step 9: Build Your APK](#step-9-build-your-apk)
11. [Troubleshooting](#troubleshooting)

---

## What You'll Need

### Hardware
- A NAS, Linux PC, or Raspberry Pi (2GB+ RAM recommended)
- Network connection

### Software (we'll install these)
- Linux OS (Ubuntu, Debian, or similar)
- Python 3.9+
- Node.js 18+
- MongoDB 6+
- Git

### Time
- About 30-60 minutes

---

## Step 1: Install Required Software

Open a terminal and run these commands:

### Update your system
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Git
```bash
sudo apt install git -y
```

### Install Python 3 and pip
```bash
sudo apt install python3 python3-pip python3-venv -y
```

### Install Node.js 18
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install nodejs -y

# Verify installation
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x or higher
```

### Install MongoDB
```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository (for Ubuntu 22.04)
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install MongoDB
sudo apt update
sudo apt install mongodb-org -y

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

---

## Step 2: Download the Code

### Create a directory for the app
```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository (replace with your GitHub URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git baby-day-book

# Go into the project folder
cd baby-day-book
```

---

## Step 3: Set Up MongoDB Database

MongoDB should already be running from Step 1. Let's create a database:

```bash
# Open MongoDB shell
mongosh

# Inside the MongoDB shell, run:
use baby_day_book

# Create the database by inserting a test document
db.test.insertOne({ test: "hello" })

# Exit MongoDB shell
exit
```

---

## Step 4: Set Up the Backend

### Navigate to the backend folder
```bash
cd ~/apps/baby-day-book/backend
```

### Create a Python virtual environment
```bash
python3 -m venv venv
```

### Activate the virtual environment
```bash
source venv/bin/activate
```

Your terminal prompt should now show `(venv)` at the beginning.

### Install Python dependencies
```bash
pip install -r requirements.txt
```

### Create the backend .env file
```bash
nano .env
```

Add these lines (press Ctrl+O to save, Ctrl+X to exit):
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="baby_day_book"
```

### Test the backend
```bash
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

Press `Ctrl+C` to stop for now.

---

## Step 5: Set Up the Frontend

### Open a new terminal window and navigate to frontend
```bash
cd ~/apps/baby-day-book/frontend
```

### Install Node.js dependencies
```bash
npm install
```

This may take a few minutes.

### Find your server's IP address
```bash
# Run this command to find your IP
hostname -I | awk '{print $1}'
```

Write down this IP address (e.g., `192.168.1.100`)

### Create/Edit the frontend .env file
```bash
nano .env
```

Add these lines (replace `YOUR_SERVER_IP` with your actual IP):
```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_SERVER_IP:8001
```

For example, if your IP is 192.168.1.100:
```
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
```

Save and exit (Ctrl+O, then Ctrl+X).

---

## Step 6: Configure Your Network

### Open firewall ports (if firewall is enabled)
```bash
# Allow backend port
sudo ufw allow 8001

# Allow frontend port
sudo ufw allow 3000

# Allow MongoDB (only if accessing from other machines)
sudo ufw allow 27017
```

### For NAS devices (Synology, QNAP, etc.)
- Go to your NAS admin panel
- Find Firewall or Security settings
- Add rules to allow ports 3000, 8001, and 27017

---

## Step 7: Start Everything

You need 2 terminal windows.

### Terminal 1: Start the Backend
```bash
cd ~/apps/baby-day-book/backend
source venv/bin/activate
python server.py
```

### Terminal 2: Start the Frontend
```bash
cd ~/apps/baby-day-book/frontend
npm start
```

### Access Your App
- **Web Browser:** Open `http://YOUR_SERVER_IP:3000`
- **Mobile (Expo Go):** Scan the QR code shown in Terminal 2

---

## Step 8: Auto-Start on Boot (Optional)

To make the app start automatically when your server boots:

### Create a systemd service for the backend
```bash
sudo nano /etc/systemd/system/babydaybook-backend.service
```

Add this content (replace `YOUR_USERNAME` with your Linux username):
```ini
[Unit]
Description=Baby Day Book Backend
After=network.target mongod.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/apps/baby-day-book/backend
Environment=PATH=/home/YOUR_USERNAME/apps/baby-day-book/backend/venv/bin
ExecStart=/home/YOUR_USERNAME/apps/baby-day-book/backend/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and exit.

### Create a systemd service for the frontend
```bash
sudo nano /etc/systemd/system/babydaybook-frontend.service
```

Add this content:
```ini
[Unit]
Description=Baby Day Book Frontend
After=network.target babydaybook-backend.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/apps/baby-day-book/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Save and exit.

### Enable and start the services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable babydaybook-backend
sudo systemctl enable babydaybook-frontend

# Start services now
sudo systemctl start babydaybook-backend
sudo systemctl start babydaybook-frontend

# Check status
sudo systemctl status babydaybook-backend
sudo systemctl status babydaybook-frontend
```

### Useful commands
```bash
# Stop services
sudo systemctl stop babydaybook-backend
sudo systemctl stop babydaybook-frontend

# Restart services
sudo systemctl restart babydaybook-backend
sudo systemctl restart babydaybook-frontend

# View logs
sudo journalctl -u babydaybook-backend -f
sudo journalctl -u babydaybook-frontend -f
```

---

## Step 9: Build Your APK

Once your server is running, you can build an APK that connects to YOUR server.

### On your local computer (not the server):

```bash
# Install EAS CLI
npm install -g eas-cli

# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME/frontend

# Login to Expo (create free account at expo.dev)
eas login

# Build APK
eas build --platform android --profile preview
```

### Important: Update the backend URL before building!
Edit `frontend/.env` to point to your server:
```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_SERVER_IP:8001
```

Then rebuild the APK.

---

## Troubleshooting

### Problem: "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if it's not running
sudo systemctl start mongod
```

### Problem: "Port already in use"
```bash
# Find what's using the port
sudo lsof -i :8001
sudo lsof -i :3000

# Kill the process (replace PID with the actual process ID)
sudo kill -9 PID
```

### Problem: "Module not found" (Backend)
```bash
cd ~/apps/baby-day-book/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Problem: "Module not found" (Frontend)
```bash
cd ~/apps/baby-day-book/frontend
rm -rf node_modules
npm install
```

### Problem: "Cannot access from phone"
1. Make sure your phone is on the same WiFi network
2. Check firewall allows ports 3000 and 8001
3. Try accessing `http://YOUR_SERVER_IP:8001/api/health` in phone browser

### Problem: "Permission denied"
```bash
# Fix ownership (replace YOUR_USERNAME)
sudo chown -R YOUR_USERNAME:YOUR_USERNAME ~/apps/baby-day-book
```

---

## 📱 Quick Reference

| Service | URL | Port |
|---------|-----|------|
| Web App | http://YOUR_SERVER_IP:3000 | 3000 |
| Backend API | http://YOUR_SERVER_IP:8001 | 8001 |
| API Health Check | http://YOUR_SERVER_IP:8001/api/health | 8001 |
| MongoDB | localhost:27017 | 27017 |

---

## 🔒 Security Tips (For Internet Access)

If you want to access your app from outside your home network:

1. **Use a reverse proxy** (like Nginx or Caddy) with HTTPS
2. **Set up a VPN** (like WireGuard or Tailscale)
3. **Never expose MongoDB to the internet**
4. **Use strong passwords**

---

## 📞 Need Help?

If you get stuck:
1. Check the Troubleshooting section above
2. Look at the error message carefully
3. Search the error message on Google
4. Ask in the Expo or FastAPI communities

---

**Congratulations! 🎉** You now have Baby Day Book running on your own server!
