# Backend Setup

## Requirements

- Node.js 18+
- MySQL 8+
- Python Flask ML service running on `http://127.0.0.1:8000` for prediction endpoints

## Install

```bash
npm install
```

## Environment

Create or update `.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Tanmaychasql@123
DB_NAME=sakhi_db

ML_SERVICE_URL=http://127.0.0.1:8000
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d

DOCTOR_NAME=Dr. Sakhi
DOCTOR_EMAIL=doctor@sakhihealth.com
DOCTOR_PASSWORD=Doctor@123
```

## Run

```bash
npm start
```

On startup the backend:

- connects to MySQL
- creates `sakhi_db` if needed
- creates all required tables
- seeds the doctor account

## Verify

```bash
curl http://127.0.0.1:5000/health
```
