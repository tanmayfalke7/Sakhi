# Quick Start Guide - Sakhi PCOS Backend

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
A `.env` file with default settings already exists:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sakhi_db
DB_NAME=sakhi_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

**For MongoDB Atlas (Cloud):**
Replace `MONGODB_URI` with your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sakhi_db?retryWrites=true&w=majority
```

**For Production:**
- Change `JWT_SECRET` to a strong random string
- Set `NODE_ENV=production`

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# On Windows
mongod

# On macOS
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
- No action needed, connection string in `.env` handles it

### 4. Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
Server running on port 5000
Environment: development
MongoDB Connected: localhost
```

## Testing the API

### Using cURL

**1. Register a New User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "securePass123",
    "passwordConfirm": "securePass123"
  }'
```

**Save the token from the response!**

**2. Login User:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePass123"
  }'
```

**3. Get Your Profile** (use token from login):
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**4. Get All Users:**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**5. Get Specific User** (replace ID):
```bash
curl http://localhost:5000/api/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**6. Update User** (replace ID):
```bash
curl -X PUT http://localhost:5000/api/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com"
  }'
```

**7. Delete User** (replace ID):
```bash
curl -X DELETE http://localhost:5000/api/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Using Postman or Thunder Client
1. Open Postman/Thunder Client
2. Import the provided `API_REQUESTS.json` file
3. Replace `{{baseUrl}}` with `http://localhost:5000`
4. Replace `YOUR_JWT_TOKEN_HERE` with actual token from register/login
5. Start testing endpoints

### Using JavaScript (Fetch)

**Register User:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Bob Wilson',
    email: 'bob@example.com',
    password: 'password456',
    passwordConfirm: 'password456'
  })
});
const data = await response.json();
console.log(data.token); // Save this token!
```

**Login User:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'bob@example.com',
    password: 'password456'
  })
});
const data = await response.json();
localStorage.setItem('token', data.token);
```

**Use Protected Route:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
```

## Authentication

✅ **New Feature:** JWT Authentication with Bearer tokens

### How It Works
1. **Register** a new user at `/api/auth/register` → Get JWT token
2. **Login** at `/api/auth/login` → Get JWT token
3. **Use Token** in `Authorization: Bearer YOUR_TOKEN` header for all protected routes
4. Tokens expire after **7 days**

### Protected Routes (Require JWT Token)
- `GET /api/auth/me` - Get your profile
- `POST /api/auth/logout` - Logout
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Unprotected Routes (No Token Needed)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /health` - Health check
- `GET /` - API info

See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed authentication documentation.

## Common Issues & Solutions

### ❌ "MongoDB connection failed"
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For local: verify mongod is listening on port 27017
- For Atlas: verify connection string is correct

### ❌ "Port already in use"
- Change `PORT` in `.env` to an available port (e.g., 5001)
- Or kill the process using the port:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID {PID} /F`
  - Linux/Mac: `lsof -ti:5000 | xargs kill -9`

### ❌ "Module not found"
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` once more

### ❌ "Not authorized to access this route"
- Missing or invalid JWT token
- Include token in Authorization header: `Bearer YOUR_TOKEN`
- Token might be expired - login again to get new token

### ❌ "CORS error in frontend"
- CORS is already enabled in `app.js` ✓
- Check frontend is accessing correct API URL
- Verify `localhost:5000` is accessible from frontend

### ❌ "Invalid credentials"
- Check email and password are correct
- Email must match exactly (case-insensitive in DB)
- Passwords are case-sensitive

## Project Structure

```
node-backend/
├── config/database.js          ← MongoDB connection
├── models/User.js              ← User schema with password hashing
├── controllers/
│   ├── authController.js       ← Authentication logic (register, login)
│   └── userController.js       ← User CRUD operations
├── routes/
│   ├── authRoutes.js           ← /api/auth endpoints
│   └── userRoutes.js           ← /api/users endpoints
├── middleware/
│   ├── authMiddleware.js       ← JWT verification
│   └── errorHandler.js         ← Error handling
├── utils/generateToken.js      ← JWT token generation
├── app.js                      ← Server setup
├── .env                        ← Configuration (ready to use)
├── package.json                ← Dependencies
├── README.md                   ← Full API documentation
└── AUTHENTICATION_GUIDE.md     ← Authentication details
```

## Dependencies

Installed and configured:
- **express** - Web framework
- **mongoose** - MongoDB ORM
- **dotenv** - Environment variables
- **cors** - Cross-origin requests
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **nodemon** (dev) - Auto-reload

## Next Steps

1. Test all authentication endpoints
2. Integrate with your frontend
3. Store JWT token in browser localStorage
4. Send token in Authorization header for protected routes
5. Add more features (predictions, health records, etc.)
6. Deploy to production

## Documentation

- **Full API Docs:** [README.md](./README.md)
- **Auth Guide:** [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
- **API Requests:** Import `API_REQUESTS.json` to Postman
- **Express.js:** https://expressjs.com/
- **Mongoose:** https://mongoosejs.com/
- **JWT:** https://jwt.io/

## Useful Commands

```bash
# Install specific dependency
npm install <package-name>

# Install dev dependency
npm install --save-dev <package-name>

# Remove dependency
npm uninstall <package-name>

# View all dependencies
npm list

# Clean installation
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions:
1. Check [README.md](./README.md) for API documentation
2. Check [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for auth help
3. Review error messages in console
4. Verify `.env` configuration
5. Check MongoDB connection status

---

Happy coding! 🚀

