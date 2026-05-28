# Sakhi Backend

Node.js/Express API for the Sakhi PCOS Pre-Risk Prediction System.

## Stack

- Express
- MySQL 8 via `mysql2`
- JWT authentication
- Flask ML service proxy for PCOS and thyroid predictions

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure `.env`:

   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=sakhi_db

   ML_SERVICE_URL=http://127.0.0.1:8000
   JWT_SECRET=change_this_to_a_long_random_secret
   JWT_EXPIRE=7d

   DOCTOR_NAME=Dr. Sakhi
   DOCTOR_EMAIL=doctor@sakhihealth.com
   DOCTOR_PASSWORD=Doctor@123
   ```

3. Start MySQL, then run:

   ```bash
   npm start
   ```

The API automatically creates the `sakhi_db` database and all required tables on startup. It also seeds the configured doctor account if it does not already exist.

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/dashboard`
- `PUT /api/users/profile`
- `POST /api/predictions/pcos`
- `POST /api/predictions/thyroid`
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/community/posts`
- `POST /api/community/posts`
- `GET /api/doctor/dashboard`
- `GET /health`
