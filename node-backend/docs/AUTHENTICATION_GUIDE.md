# JWT Authentication Guide

This guide explains how to use JWT authentication in the Sakhi PCOS Backend API.

## Overview

The backend uses **JSON Web Tokens (JWT)** for stateless authentication. This means:
- No server-side sessions are needed
- Tokens are self-contained and secure
- Each request includes the token in the `Authorization` header
- Tokens expire after 7 days (configurable)

## Getting Started

### 1. Register a New User

First, create a new user account:

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "passwordConfirm": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MDEyMzQ1Njc4OTBhYmNkZWYxMjM0NTYiLCJpYXQiOjE3MTIzNDU2NzgsImV4cCI6MTcxMjk1MDQ3OH0.xL9kN2jQ5PmV6rW8sY3....",
  "data": {
    "id": "6501234567890abcdef123456",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-04-10T12:00:00.000Z"
  }
}
```

**Save the token** for future requests!

### 2. Login Existing User

If you already have an account:

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "6501234567890abcdef123456",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Using the Token

### Authorization Header Format

All protected endpoints require this header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Protected Endpoints

These endpoints require a valid JWT token:

| Endpoint | Method | Protected |
|----------|--------|-----------|
| `/api/auth/me` | GET | ✅ Yes |
| `/api/auth/logout` | POST | ✅ Yes |
| `/api/users` | GET | ✅ Yes |
| `/api/users/:id` | GET | ✅ Yes |
| `/api/users` | POST | ✅ Yes |
| `/api/users/:id` | PUT | ✅ Yes |
| `/api/users/:id` | DELETE | ✅ Yes |

### Unprotected Endpoints

These endpoints do NOT require a token:

| Endpoint | Method |
|----------|--------|
| `/api/auth/register` | POST |
| `/api/auth/login` | POST |
| `/health` | GET |
| `/` | GET |

## Common Tasks

### Get Your Profile

**Request:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6501234567890abcdef123456",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-04-10T12:00:00.000Z",
    "updatedAt": "2024-04-10T12:00:00.000Z"
  }
}
```

### Get All Users

**Request:**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "6501234567890abcdef123456",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-04-10T12:00:00.000Z",
      "updatedAt": "2024-04-10T12:00:00.000Z"
    },
    {
      "_id": "6501234567890abcdef123457",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2024-04-10T13:00:00.000Z",
      "updatedAt": "2024-04-10T13:00:00.000Z"
    }
  ]
}
```

### Update Your Profile

**Request:**
```bash
curl -X PUT http://localhost:5000/api/users/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "6501234567890abcdef123456",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "createdAt": "2024-04-10T12:00:00.000Z",
    "updatedAt": "2024-04-10T12:15:00.000Z"
  }
}
```

### Logout

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## JavaScript/Fetch Examples

### Register User
```javascript
async function registerUser() {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123',
      passwordConfirm: 'securePassword123'
    })
  });
  
  const data = await response.json();
  console.log(data.token); // Save this token!
  return data.token;
}
```

### Login User
```javascript
async function loginUser() {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john@example.com',
      password: 'securePassword123'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token); // Save token
  return data.token;
}
```

### Use Token in Protected Requests
```javascript
async function getProfile(token) {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}

async function getAllUsers(token) {
  const response = await fetch('http://localhost:5000/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}
```

### Logout
```javascript
async function logoutUser(token) {
  const response = await fetch('http://localhost:5000/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  localStorage.removeItem('token'); // Clear token
  return await response.json();
}
```

## Error Handling

### Invalid Token
```json
{
  "success": false,
  "message": "Not authorized to access this route - Invalid token"
}
```

### Missing Token
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### User Already Exists
```json
{
  "success": false,
  "message": "User with that email already exists"
}
```

### Password Mismatch
```json
{
  "success": false,
  "message": "Passwords do not match"
}
```

## Security Best Practices

### 1. Store Token Securely
- **Web Apps**: Use `localStorage` or `sessionStorage`
  ```javascript
  localStorage.setItem('token', response.token);
  ```
- **Mobile Apps**: Use secure storage (Keychain, Keystore)
- **Important**: Never expose tokens in logs or error messages

### 2. Include Token in All Requests
- Always send token in `Authorization: Bearer` header
- Never include token in URLs or request body

### 3. Handle Token Expiration
- Tokens expire after 7 days
- Prompt user to login again when token expires
- Watch for 401 Unauthorized responses

### 4. Environment Variables
- In `.env`: `JWT_SECRET=your_secret_key`
- Change secret in production
- Use strong, random secrets

### 5. HTTPS
- Always use HTTPS in production
- Never send tokens over unsecured HTTP

## Token Information

### Token Structure

JWT tokens have 3 parts:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJpZCI6IjY1MDEyMzQ1Njc4OTBhYmNkZWYxMjM0NTYiLCJpYXQiOjE3MTIzNDU2NzgsImV4cCI6MTcxMjk1MDQ3OH0 . xL9kN2jQ5PmV6rW8sY3...
```

1. **Header**: Algorithm and token type (base64)
2. **Payload**: User ID, issued time, expiration (base64)
3. **Signature**: HMAC signature (base64)

### Token Content (Decoded)
```json
{
  "id": "6501234567890abcdef123456",
  "iat": 1712345678,
  "exp": 1712950478
}
```

### Token Expiry
- **Issued At (iat)**: When token was created
- **Expires At (exp)**: When token becomes invalid
- **Default**: 7 days from creation
- **Status Code**: 401 when expired

## FAQ

**Q: My token is expired. What do I do?**
A: Login again to get a new token using `/api/auth/login`

**Q: Can I refresh my token without logging in?**
A: Current implementation doesn't support refresh tokens. Login again to get a new token.

**Q: Where should I store the token?**
A: Use localStorage for web apps (or sessionStorage for temporary storage). For mobile, use secure device storage.

**Q: What if I lose my token?**
A: Login again with your email and password to get a new token. Tokens are stateless, so old tokens cannot be revoked.

**Q: Can I use the same token for multiple requests?**
A: Yes! Use the same token for all requests until it expires.

**Q: What's the difference between login and register?**
A: Register creates a NEW account, Login accesses an EXISTING account.

## Support

For issues:
1. Check that your token is valid and not expired
2. Verify `Authorization` header format: `Bearer YOUR_TOKEN`
3. Check the error response message
4. Review the main [README.md](./README.md)

---

Happy coding! 🚀
