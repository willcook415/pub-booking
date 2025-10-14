# Pub Booking System 

A full-stack **pub table booking system** built to handle online reservations, confirmation emails, and admin-side management for The Curious Cat Pub.

This repository contains the **backend and booking logic** (Express, PostgreSQL, SendGrid), while the admin dashboard is hosted in a separate repository.

---

## Overview

**Pub-Booking** powers real-time table reservations through an intuitive web interface.  
Customers can submit bookings directly through the public website, while admins manage and confirm them via a secure dashboard.

Key features include:
- Booking creation, retrieval, and cancellation
- Email confirmations and notifications via SendGrid
- Validation and sanitisation middleware for safe inputs
- PostgreSQL data persistence with Sequelize ORM
- Secure login/authentication system for admin routes
- Deployment on **Render** (backend) and **Netlify** (frontend)

---

## Tech Stack

| Area | Technology |
|------|-------------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL + Sequelize ORM |
| **Email Service** | SendGrid |
| **Hosting** | Render (server), Netlify (frontend) |
| **Authentication** | JWT-based login system |
| **Other Tools** | dotenv, bcrypt, CORS, body-parser |

---

## Project Structure

```
pub-booking/
├── build/               # Compiled frontend (if included in build)
├── config/              # DB config, env setup
├── middleware/          # Auth & validation middleware
├── migrations/          # Sequelize migration files
├── models/              # Sequelize models (Bookings, Users, etc.)
├── public/              # Static assets, transfer notices, etc.
├── routes/              # Express route definitions (auth, bookings)
├── seeders/             # Initial DB seed data
├── server.js            # Main Express server entry point
├── package.json         # Dependencies and scripts
└── .gitignore
```

---

## Setup & Installation

### 1️⃣ Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL installed and running
- A SendGrid API key (for booking confirmation emails)

### 2️⃣ Installation

```bash
# clone the repo
git clone https://github.com/willcook415/pub-booking.git
cd pub-booking

# install dependencies
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in the root directory:

```bash
PORT=5000
DATABASE_URL=postgres://<user>:<password>@localhost:5432/pubbooking
JWT_SECRET=<your_secret_key>
SENDGRID_API_KEY=<your_sendgrid_key>
ADMIN_EMAIL=<your_admin_email>
```

### 4️⃣ Database Setup

```bash
# run migrations and seed data
npx sequelize db:migrate
npx sequelize db:seed:all
```

### 5️⃣ Run the Server

```bash
npm run dev
```

The backend will start on [http://localhost:5000](http://localhost:5000)

---

## 🔗 Related Repositories

- **Admin Dashboard:** [pub-admin-dashboard](https://github.com/willcook415/pub-admin-dashboard)

---

## Key Features

- Booking creation, viewing, and cancellation  
- Email confirmation using SendGrid  
- Secure admin authentication system  
- Modular route and middleware structure  
- Ready for production deployment on Render  

---

## Author

**William Cook**  
MEng Mechanical Engineering — University of Leeds  
🔗 [GitHub](https://github.com/willcook415) · [LinkedIn](https://www.linkedin.com/in/william-g-cook)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
