<p align="center">
  <img src="https://img.icons8.com/color/96/baby.png" alt="Baby Day Book Logo" width="96" height="96">
</p>

<h1 align="center">🍼 Baby Day Book</h1>

<p align="center">
  <strong>Track your baby's feeding, sleep, diapers & growth with ease</strong>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/React%20Native-Expo-purple" alt="Expo">
  <img src="https://img.shields.io/badge/Backend-FastAPI-teal" alt="FastAPI">
</p>

---

## 📖 About

**Baby Day Book** is a comprehensive baby tracking application designed to help parents and caregivers monitor their baby's daily activities. Track feedings, sleep patterns, diaper changes, and growth milestones all in one beautiful, easy-to-use app.

Whether you're a new parent wanting to establish routines, or caregivers needing to share information, Baby Day Book makes it simple to log and review your baby's day.

---

## ✨ Features

### 👶 Baby Profile Management
- Create and manage baby profiles
- Track age automatically from birth date
- Add photos to personalize profiles

### 🍼 Feeding Tracker
- **Breastfeeding** - Track left/right side with duration timer
- **Bottle Feeding** - Log amount in ml
- **Solid Foods** - Record food types and notes

### 😴 Sleep Tracker
- **Start/Stop Timer** - Real-time sleep tracking with live counter
- **Manual Entry** - Log past sleep sessions
- **Nap vs Night Sleep** - Categorize sleep types
- **Sleep Quality** - Rate sleep as good, fair, or poor
- **Smart Predictions** - AI-powered next nap time predictions based on age and patterns

### 🧷 Diaper Tracker
- Log wet, dirty, or mixed diapers
- Add notes for any concerns
- Daily diaper count statistics

### 📏 Growth Tracker
- Record weight (kg)
- Record height (cm)
- Track head circumference
- **WHO Growth Charts** - Compare against WHO percentile standards
- Visual percentile indicators with health guidance

### 📊 Statistics & Reports
- **Daily Summary** - View feeding count, sleep hours, diaper changes
- **Weekly Charts** - Visual bar charts for trends
- **Growth History** - Track growth over time
- **PDF Export** - Generate professional reports to share with pediatricians

### 👨‍👩‍👧 Family Sharing
- Invite caregivers by email
- Multiple users can track the same baby
- Accept/decline sharing invitations
- Owner controls access

### 🔔 Smart Reminders
- Push notifications for predicted nap times
- Feeding reminders
- Customizable notification settings

### 🔐 Secure Authentication
- Google OAuth login
- Secure session management
- Data privacy

---

## 📱 Screenshots

<p align="center">
  <i>Coming soon - Screenshots of the app in action</i>
</p>

| Home Screen | Track Activity | Statistics | Profile |
|:-----------:|:--------------:|:----------:|:-------:|
| Timeline view | Quick logging | Daily/Weekly stats | Baby & user info |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile development |
| **Expo** | Development framework & tools |
| **Expo Router** | File-based navigation |
| **TypeScript** | Type safety |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python API |
| **MongoDB** | NoSQL database |
| **Motor** | Async MongoDB driver |

### Authentication
| Technology | Purpose |
|------------|---------|
| **Emergent OAuth** | Google social login |
| **Secure Sessions** | JWT-like session tokens |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB 6+
- Expo Go app (for mobile testing)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/popadrianc/BabyCareApp.git
   cd BabyCareApp
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Create backend/.env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="baby_day_book"
   ```

4. **Start the backend**
   ```bash
   python server.py
   ```

5. **Set up the frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   ```

6. **Configure frontend environment**
   ```bash
   # Create frontend/.env
   EXPO_PUBLIC_BACKEND_URL=http://YOUR_IP:8001
   ```

7. **Start the frontend**
   ```bash
   npm start
   ```

8. **Open the app**
   - **Web:** http://localhost:3000
   - **Mobile:** Scan QR code with Expo Go app

---

## 🏠 Self-Hosting

Want to run Baby Day Book on your own server, NAS, or home lab?

### 📚 [Complete Self-Hosting Guide](./SELF_HOSTING_GUIDE.md)

The guide includes:
- Step-by-step installation instructions
- MongoDB setup
- Systemd service configuration for auto-start
- Firewall configuration
- APK building instructions
- Troubleshooting tips

---

## 📡 API Documentation

### Base URL
```
http://YOUR_SERVER:8001/api
```

### Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/session` | Exchange session ID for token |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout user |

#### Baby Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/baby` | List all babies |
| POST | `/baby` | Create baby profile |
| GET | `/baby/{id}` | Get baby details |
| PUT | `/baby/{id}` | Update baby |
| DELETE | `/baby/{id}` | Delete baby |

#### Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feeding` | Log feeding |
| GET | `/feeding/{baby_id}` | Get feedings |
| POST | `/sleep` | Log sleep |
| GET | `/sleep/{baby_id}` | Get sleep records |
| GET | `/sleep/prediction/{baby_id}` | Get sleep prediction |
| POST | `/diaper` | Log diaper change |
| GET | `/diaper/{baby_id}` | Get diaper records |
| POST | `/growth` | Log growth |
| GET | `/growth/{baby_id}` | Get growth records |

#### Statistics & Timeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/timeline/{baby_id}` | Get daily timeline |
| GET | `/stats/{baby_id}` | Get daily statistics |

#### Family Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/share/invite` | Send invite |
| GET | `/share/invites/pending` | Get pending invites |
| POST | `/share/invite/{id}/accept` | Accept invite |
| POST | `/share/invite/{id}/decline` | Decline invite |

---

## 📁 Project Structure

```
baby-day-book/
├── 📁 backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend configuration
│
├── 📁 frontend/
│   ├── 📁 app/            # Expo Router screens
│   │   ├── (tabs)/        # Tab navigation screens
│   │   ├── add-baby.tsx   # Add baby screen
│   │   ├── edit-baby.tsx  # Edit baby screen
│   │   └── settings.tsx   # Settings screen
│   │
│   ├── 📁 src/
│   │   ├── contexts/      # React contexts (Auth, Baby)
│   │   ├── services/      # API & utility services
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   │
│   ├── app.json           # Expo configuration
│   ├── eas.json           # EAS Build configuration
│   ├── package.json       # Node dependencies
│   └── .env               # Frontend configuration
│
├── SELF_HOSTING_GUIDE.md  # Self-hosting tutorial
└── README.md              # This file
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Baby Daybook](https://play.google.com/store/apps/details?id=com.drillyapps.babydaybook) app
- WHO Growth Standards for percentile data
- Built with [Expo](https://expo.dev) and [FastAPI](https://fastapi.tiangolo.com)

---

<p align="center">
  Made with ❤️ for parents everywhere
</p>

<p align="center">
  <a href="#-baby-day-book">Back to top ↑</a>
</p>
