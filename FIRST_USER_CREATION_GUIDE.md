# Guide: Creating First User for a Tenant

## Overview

There are **two scenarios** for creating users:

1. **First User (Superadmin) for a NEW Tenant** - No authentication required
2. **Additional Users** - Requires authentication (superadmin role)

---

## Scenario 1: Creating First Superadmin for a New Tenant

### Endpoint
**`POST /api/users/onboard-superadmin`**  
**Auth Required:** ❌ **NO** (Special onboarding endpoint)

### When to Use
- When creating the **very first user** for a new tenant
- Only works if the tenant has **zero existing users**
- This user will be created with `role: 'superadmin'`

### Request Body
```json
{
  "tenantId": "6852eb75de523aa426a43743",  // Required: Tenant _id (ObjectId string)
  "email": "superadmin@company.com",        // Required: Unique email
  "name": "John Doe",                        // Required: User's full name
  "password": "SecurePassword123!",          // Required: Plain text password (auto-hashed)
  "code": 1001,                              // Optional: Employee code
  "phone": "+91-9876543210",                 // Optional: Phone number
  "address": "123 Main St, City, Country"   // Optional: Address
}
```

### Validation Rules
1. ✅ `tenantId`, `email`, `name`, and `password` are **required**
2. ✅ Tenant must exist in database
3. ✅ Tenant must have **zero existing users** (enforced by endpoint)
4. ✅ Email must be unique for this tenant

### Response (Success - 201)
```json
{
  "message": "Superadmin created successfully",
  "user": {
    "_id": "6852eb75de523aa426a43744",
    "tenantId": "6852eb75de523aa426a43743",
    "email": "superadmin@company.com",
    "name": "John Doe",
    "role": "superadmin",
    "isActive": true,
    "status": "active",
    "code": 1001,
    "createdAt": "2025-01-15T10:05:00.000Z"
    // password is excluded from response
  }
}
```

### Error Responses
- **400**: Missing required fields or email already exists
- **403**: Tenant already has users (use authenticated endpoint instead)
- **404**: Tenant not found
- **500**: Server error

### Postman Example
```
POST {{baseURL}}/api/users/onboard-superadmin
Content-Type: application/json

{
  "tenantId": "6852eb75de523aa426a43743",
  "email": "admin@company.com",
  "name": "Admin User",
  "password": "Admin123!",
  "code": 1001
}
```

---

## Scenario 2: Creating Additional Users (After First User Exists)

### Endpoint
**`POST /api/user-management`**  
**Auth Required:** ✅ **YES** (Superadmin role only)

### When to Use
- Creating users **after** the first superadmin exists
- Requires authentication token from logged-in superadmin
- Only `superadmin` role can create users via this endpoint

### Request Headers
```
Authorization: Bearer <token>
// OR
Cookie: token=<token>
```

### Request Body
```json
{
  "email": "user@company.com",        // Required
  "name": "Jane Doe",                 // Required
  "password": "UserPassword123!",     // Required
  "role": "admin",                    // Required: 'superadmin', 'admin', or 'team_member'
  "code": 1002,                       // Optional
  "phone": "+91-9876543210",          // Optional
  "address": "123 Main St",           // Optional
  "isActive": true,                   // Optional: defaults to true
  "status": "active"                  // Optional: defaults to 'active'
}
```

### Notes
- `tenantId` and `createdBy` are **automatically** extracted from `req.user` (JWT token)
- Email must be unique for the tenant
- Password is automatically hashed by the User model's pre-save hook

### Response (Success - 201)
```json
{
  "_id": "6852eb75de523aa426a43745",
  "tenantId": "6852eb75de523aa426a43743",
  "email": "user@company.com",
  "name": "Jane Doe",
  "role": "admin",
  "isActive": true,
  "status": "active",
  "createdBy": "6852eb75de523aa426a43744",
  "createdAt": "2025-01-15T10:10:00.000Z"
}
```

---

## Complete Flow: Setting Up a New Tenant

### Step 1: Create Tenant
```bash
POST /api/tenants
{
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "subdomain": "acme",
  "id": 1001
}
```
**Response:** Save the `_id` (e.g., `"6852eb75de523aa426a43743"`)

### Step 2: Create First Superadmin
```bash
POST /api/users/onboard-superadmin
{
  "tenantId": "6852eb75de523aa426a43743",  // From Step 1
  "email": "admin@acme.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

### Step 3: Login with Superadmin
```bash
POST /api/auth/login
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```
**Response:** Save the `token` from cookie or response

### Step 4: Create Additional Users (Optional)
```bash
POST /api/user-management
Headers: Cookie: token=<token_from_step_3>
{
  "email": "user@acme.com",
  "name": "Jane Doe",
  "password": "UserPass123!",
  "role": "admin"
}
```

---

## Code Review Summary

### Available Endpoints

1. **`POST /api/users/onboard-superadmin`** ✅
   - **No auth required**
   - Creates first superadmin for new tenant
   - Validates tenant has zero users
   - Location: `controllers/userController.js:376`

2. **`POST /api/user-management`** ✅
   - **Auth required** (superadmin only)
   - Creates additional users
   - Uses `req.user.tenantId` and `req.user.userId`
   - Location: `controllers/userController.js:148`

3. **`POST /api/user`** ❌ (Commented out)
   - Currently disabled in routes
   - Would require auth and `req.user.tenantId`

### Security Notes

✅ **Good Practices:**
- First user endpoint validates tenant has no existing users
- Password is automatically hashed (bcrypt in pre-save hook)
- Password is excluded from responses
- Tenant isolation enforced via `tenantId` checks

⚠️ **Considerations:**
- First user endpoint is public (no auth) - ensure it's only used during onboarding
- Email uniqueness is checked per tenant (good for multitenancy)
- `createdBy` is set for additional users but not for first superadmin (intentional)

### Recommendations

1. **For First User:**
   - Use `POST /api/users/onboard-superadmin`
   - Ensure tenant exists first
   - Only works if tenant has zero users

2. **For Additional Users:**
   - Login as superadmin first
   - Use `POST /api/user-management` with auth token
   - Only superadmin role can create users

3. **Alternative Flow (if needed):**
   - If you need to create users programmatically, you could:
     - Create a script that directly inserts into MongoDB
     - Or use the onboarding endpoint before any users exist

---

## Troubleshooting

### Error: "Tenant already has users"
**Cause:** You're trying to use `/onboard-superadmin` but tenant already has users  
**Solution:** Use `/user-management` endpoint with authentication instead

### Error: "Tenant not found"
**Cause:** The `tenantId` doesn't exist in database  
**Solution:** Create tenant first using `POST /api/tenants`

### Error: "User with this email already exists"
**Cause:** Email is already taken for this tenant  
**Solution:** Use a different email or check existing users

### Error: "Unauthorized" when using `/user-management`
**Cause:** Missing or invalid auth token, or user is not superadmin  
**Solution:** Login first and ensure you're logged in as superadmin

