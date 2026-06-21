<div align="center">

# ✨ GlowLink

**A full-stack beauty services marketplace connecting clients with verified beauty specialists.**

[![Live Demo](https://img.shields.io/badge/demo-live-pink)](https://glowlink.onrender.com)
[![Backend API](https://img.shields.io/badge/API-docs-purple)](https://glowlink-backend.onrender.com/docs)

</div>

---

## Overview

GlowLink is a booking platform built for the beauty industry — think hair, nails, makeup, skincare, lashes, and brows. Clients can discover verified specialists, view portfolios and reviews, book appointments, pay via M-Pesa, and message specialists directly. Specialists get a full dashboard to manage their services, availability, bookings, and portfolio.

The platform supports three roles: **clients**, **specialists**, and **admins**, each with a tailored dashboard and permission set.

## Live Demo

- **App:** [glowlink.onrender.com](https://glowlink.onrender.com)
- **API Docs:** [glowlink-backend.onrender.com/docs](https://glowlink-backend.onrender.com/docs)

> Note: hosted on Render's free tier — the backend may take ~30–60 seconds to wake up on first request.

## Features

### For Clients
- Browse and search verified beauty specialists by category, location, and rating
- View specialist profiles with services, pricing, availability, portfolio, and reviews
- Book appointments and pay securely via **M-Pesa STK Push**
- Message specialists directly within the app
- Leave reviews after completed bookings
- Track booking history and status

### For Specialists
- Build a public profile with bio, speciality categories, and availability schedule
- Upload portfolio photos and videos to showcase work
- Manage services and pricing
- Accept, confirm, or decline bookings
- Chat with clients in real time
- Get notified when verified by an admin

### For Admins
- Dashboard with platform-wide stats (users, specialists, bookings, pending verifications)
- Manage users — change roles, suspend/activate, delete
- Review and verify specialist applications
- Manage specialist profiles platform-wide

### Platform-wide
- Email/password authentication and **Google OAuth**
- Password reset via email
- Real-time-feeling messaging (polling-based)
- Responsive UI across mobile, tablet, and desktop

## Tech Stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- date-fns
- React Hot Toast
- Lucide Icons

**Backend**
- FastAPI (Python)
- MongoDB Atlas + Motor (async driver)
- JWT authentication (python-jose)
- Passlib + bcrypt for password hashing
- Google OAuth 2.0
- Safaricom Daraja API (M-Pesa STK Push)
- Resend (transactional email)

**Infrastructure**
- Render (frontend static site + backend web service)
- MongoDB Atlas (database)

## Architecture

```
glowlink/
├── frontend/                  # React + TypeScript SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── client/        # Client-facing pages
│   │   │   ├── specialist/    # Specialist dashboard pages
│   │   │   └── admin/         # Admin dashboard pages
│   │   ├── components/
│   │   │   ├── chat/          # Messaging UI
│   │   │   └── payments/      # M-Pesa payment modal
│   │   ├── context/           # Auth context
│   │   └── services/          # API client (axios)
│   └── ...
│
└── backend/                   # FastAPI application
    ├── app/
    │   ├── routers/            # auth, users, specialists, services,
    │   │                       # bookings, payments, messages,
    │   │                       # reviews, portfolio, admin
    │   ├── core/                # config, security
    │   ├── models/               # Pydantic schemas
    │   ├── mpesa.py               # Daraja API integration
    │   └── database.py            # MongoDB connection
    └── requirements.txt
```

Each role (client/specialist/admin) has its own distinct visual theme — rose/pink for clients, violet/purple for specialists, and slate/indigo for the admin dashboard.

## Payments

GlowLink integrates **Safaricom's Daraja API** for M-Pesa payments:

1. Client selects a service and confirms booking details
2. Backend initiates an **STK Push** to the client's phone
3. Client enters their M-Pesa PIN to authorize payment
4. Safaricom sends a callback to the backend confirming payment
5. Booking is automatically confirmed on success, or cancelled on failure

Currently configured for Safaricom's sandbox environment for testing.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (or local MongoDB instance)
- Google OAuth credentials
- Safaricom Daraja sandbox credentials
- Resend API key (for emails)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

MPESA_CONSUMER_KEY=your_daraja_consumer_key
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_daraja_passkey

RESEND_API_KEY=your_resend_api_key
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

App available at `http://localhost:5173`

## Roadmap

- [ ] Switch to Cloudinary for persistent image storage
- [ ] Move M-Pesa integration to production credentials
- [ ] Add push notifications for bookings and messages
- [ ] Specialist earnings dashboard and payout tracking
- [ ] In-app calendar sync for specialist availability

## Author

Built by **Vincent Wambui** ([@VINN5](https://github.com/VINN5))

Portfolio: [p-portfolio-two.vercel.app](https://p-portfolio-two.vercel.app)

## License

This project is currently unlicensed / proprietary. Contact the author for usage permissions.
