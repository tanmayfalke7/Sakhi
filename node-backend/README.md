# Sakhi PCOS Backend API

A complete Node.js backend for the Sakhi PCOS Pre-Risk Prediction System built with Express, MongoDB, and JWT authentication.

## Features

- ✅ RESTful API with Express.js
- ✅ MongoDB/Mongoose integration
- ✅ JWT authentication with Bearer tokens
- ✅ Password hashing with bcryptjs
- ✅ Protected routes with auth middleware
- ✅ CORS support
- ✅ Error handling middleware
- ✅ Environment variable configuration
- ✅ MVC architecture
- ✅ Async/await pattern

## Project Structure

```
node-backend/
├── config/
│   └── database.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js        # Authentication logic (register, login, logout)
│   └── userController.js        # User CRUD operations
├── middleware/
│   ├── authMiddleware.js        # JWT verification middleware
│   └── errorHandler.js          # Error handling middleware
├── models/
│   └── User.js                  # User schema with password hashing
├── routes/
│   ├── authRoutes.js            # Authentication routes
│   └── userRoutes.js            # User API routes
├── utils/
│   └── generateToken.js         # JWT token generation utility
├── app.js                       # Express app setup
├── package.json                 # Project dependencies
├── .env                         # Environment variables
└── .env.example                 # Environment variables template
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` with your MongoDB connection string, JWT secret, and preferred port

3. **Ensure MongoDB is running:**
   - Local MongoDB: `mongod`
   - Or use MongoDB Atlas (update `MONGODB_URI` in `.env`)

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sakhi_db
DB_NAME=sakhi_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

**For production:**
- Change `JWT_SECRET` to a strong random string
- Set `NODE_ENV=production`
- Use MongoDB Atlas for `MONGODB_URI`

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the port specified in `.env` (default: 5000)

## API Endpoints

### Base URL
```
http://localhost:5000
```

## Authentication Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "..."
  }
}
```

### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE

Response (200):
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4. Logout User
```
POST /api/auth/logout
Authorization: Bearer YOUR_TOKEN_HERE

Response (200):
{
  "success": true,
  "message": "Logout successful"
}
```

## Protected User Endpoints

All user routes are now **protected** and require a valid JWT token in the `Authorization` header.

### Format: Authorization Header
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### 1. Get All Users
```
GET /api/users
Authorization: Bearer YOUR_TOKEN_HERE

Response (200):
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### 2. Get User by ID
```
GET /api/users/:id
Authorization: Bearer YOUR_TOKEN_HERE

Response (200):
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 3. Create User (Admin/Internal)
```
POST /api/users
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (201):
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4. Update User
```
PUT /api/users/:id
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

Body:
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

Response (200):
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 5. Delete User
```
DELETE /api/users/:id
Authorization: Bearer YOUR_TOKEN_HERE

Response (200):
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

### Health Check
```
GET /health

Response (200):
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-04-09T10:30:00.000Z"
}
```

## Authentication

### JWT Tokens
- Tokens are valid for **7 days** (configurable via `JWT_EXPIRE`)
- Always include token in `Authorization` header as: `Bearer YOUR_TOKEN_HERE`
- Tokens are stateless - no server-side session storage needed
- User routes require valid JWT token

### How to Use
1. **Register or Login** to get a JWT token
2. **Store the token** in your client application
3. **Include token** in `Authorization` header for protected routes:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Error Handling

The API returns detailed error responses:

### Example Error Response
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors, duplicate entries, mismatched passwords)
- `401` - Unauthorized (invalid token, expired token, invalid credentials)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

### Authentication Errors
- `"Not authorized to access this route"` - Missing token
- `"Not authorized to access this route - Invalid token"` - Token is invalid or expired
- `"Invalid credentials"` - Wrong email or password during login

## Validation Rules

### User Model
- **Name**: Required, max 100 characters
- **Email**: Required, unique, valid email format, stored as lowercase
- **Password**: Required, minimum 6 characters, automatically hashed
- **Password Confirm**: Required during registration, must match password

### Password Security
- Passwords are automatically hashed using bcryptjs (salt rounds: 10)
- Passwords are never returned in API responses
- Use `matchPassword()` method to verify passwords
- Original passwords are irretrievable after hashing

### Timestamps
- Each user record includes `createdAt` and `updatedAt` timestamps
- Automatically managed by Mongoose

## Testing with cURL

### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

Save the token from the response for next requests.

### 3. Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Get All Users (Protected)
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 5. Get User by ID (Protected)
```bash
curl http://localhost:5000/api/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 6. Create User (Protected)
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Another User",
    "email": "another@example.com",
    "password": "password456"
  }'
```

### 7. Update User (Protected)
```bash
curl -X PUT http://localhost:5000/api/users/{USER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Updated Name",
    "email": "newemail@example.com"
  }'
```

### 8. Delete User (Protected)
```bash
curl -X DELETE http://localhost:5000/api/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 9. Logout User
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ORM
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation and verification
- **nodemon** (dev) - Auto-reload during development

## Next Steps

1. ✅ Authentication/JWT (Completed)
2. Add more models (predictions, health records, etc.)
3. Implement validation middleware
4. Add request logging
5. Set up testing framework (Jest)
6. Deploy to production

## License

MIT
