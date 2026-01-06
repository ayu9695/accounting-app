# Multitenant Setup Guide

This document explains how to create a new tenant, set up the first superadmin user, and configure initial settings.

## Overview

The system uses **tenant isolation** where:
- Each tenant has a unique `_id` (MongoDB ObjectId) and a numeric `id`
- All data (users, invoices, clients, etc.) is scoped to a `tenantId`
- Authentication tokens include `tenantId` to enforce data isolation
- The first superadmin for a new tenant is created via a special onboarding endpoint (no auth required)

---

## Step-by-Step: Creating a New Tenant

### Step 1: Create Tenant

**Endpoint:** `POST /api/tenants`  
**Auth Required:** ❌ No

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "subdomain": "acme",
  "id": 1001
}
```

**Note:** If you omit `id`, it will be auto-generated using a counter sequence.

**Response:**
```json
{
  "_id": "6852eb75de523aa426a43743",
  "name": "Acme Corporation",
  "id": 1001,
  "email": "admin@acme.com",
  "subdomain": "acme",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Save the `_id`** - you'll need it for the next steps!

---

### Step 2: Create First Superadmin User

**Endpoint:** `POST /api/users/onboard-superadmin`  
**Auth Required:** ❌ No (special onboarding endpoint)

**Request Body:**
```json
{
  "tenantId": "6852eb75de523aa426a43743",
  "email": "superadmin@acme.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "code": 1001,
  "phone": "+91-9876543210",
  "address": "123 Main St, City, Country"
}
```

**Required Fields:**
- `tenantId`: The `_id` from Step 1 (ObjectId string)
- `email`: Unique email for this tenant
- `name`: User's full name
- `password`: Plain text password (will be hashed automatically)

**Optional Fields:**
- `code`: Employee code
- `phone`: Phone number
- `address`: Address

**Response:**
```json
{
  "message": "Superadmin created successfully",
  "user": {
    "_id": "6852eb75de523aa426a43744",
    "tenantId": "6852eb75de523aa426a43743",
    "email": "superadmin@acme.com",
    "name": "John Doe",
    "role": "superadmin",
    "isActive": true,
    "status": "active",
    "code": 1001,
    "createdAt": "2025-01-15T10:05:00.000Z"
  }
}
```

**Important:** This endpoint will **only work if the tenant has no existing users**. Once a user exists, you must use the regular authenticated endpoints.

---

### Step 3: Create Initial Settings

**Endpoint:** `POST /api/settings/onboard`  
**Auth Required:** ❌ No (special onboarding endpoint)

**Request Body:**
```json
{
  "tenantId": "6852eb75de523aa426a43743",
  "domain": "acme.com",
  "tenantNumber": 1001,
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "gstNumber": "29AABCU9603R1ZX",
  "currency": "INR",
  "gstEnabled": true,
  "defaultTaxRates": {
    "cgst": 9,
    "sgst": 9,
    "igst": 18
  },
  "defaultTdsRate": 10,
  "phone": "+91-9876543210",
  "address": "123 Main St, City, State - 110001",
  "invoicePrefix": "ACM",
  "fiscalYearStart": "2025-04-01",
  "fiscalYearEnd": "2026-03-31",
  "bankAccountDetails": [
    {
      "accountName": "Acme Corporation",
      "accountNumber": "123456789012",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0001234",
      "branch": "Main Branch",
      "primaryAccount": true
    }
  ]
}
```

**Required Fields:**
- `tenantId`: The `_id` from Step 1
- `domain`: Unique domain/subdomain
- `tenantNumber`: Numeric tenant identifier
- `name`: Company name
- `email`: Company email
- `gstNumber`: GST registration number

**Response:**
```json
{
  "message": "Settings created successfully",
  "data": {
    "_id": "6852eb75de523aa426a43745",
    "tenantId": "6852eb75de523aa426a43743",
    "domain": "acme.com",
    "tenantNumber": 1001,
    "name": "Acme Corporation",
    "email": "admin@acme.com",
    "gstNumber": "29AABCU9603R1ZX",
    "currency": "INR",
    "gstEnabled": true,
    "defaultTaxRates": {
      "cgst": 9,
      "sgst": 9,
      "igst": 18
    },
    "createdAt": "2025-01-15T10:10:00.000Z"
  }
}
```

---

### Step 4: Login as Superadmin

**Endpoint:** `POST /api/auth/login`  
**Auth Required:** ❌ No

**Request Body:**
```json
{
  "email": "superadmin@acme.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "email": "superadmin@acme.com",
    "role": "superadmin",
    "name": "John Doe"
  }
}
```

**Note:** The JWT token is set as an HTTP-only cookie. Subsequent requests will automatically include this token.

---

## Postman Collection Examples

### 1. Create Tenant

```http
POST http://localhost:3000/api/tenants
Content-Type: application/json

{
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "subdomain": "acme"
}
```

### 2. Create Superadmin (Onboarding)

```http
POST http://localhost:3000/api/users/onboard-superadmin
Content-Type: application/json

{
  "tenantId": "6852eb75de523aa426a43743",
  "email": "superadmin@acme.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "code": 1001
}
```

### 3. Create Settings (Onboarding)

```http
POST http://localhost:3000/api/settings/onboard
Content-Type: application/json

{
  "tenantId": "6852eb75de523aa426a43743",
  "domain": "acme.com",
  "tenantNumber": 1001,
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "gstNumber": "29AABCU9603R1ZX",
  "currency": "INR",
  "gstEnabled": true,
  "defaultTaxRates": {
    "cgst": 9,
    "sgst": 9,
    "igst": 18
  }
}
```

### 4. Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@acme.com",
  "password": "SecurePassword123!"
}
```

---

## Multitenant Verification Checklist

After creating a tenant, verify:

- [ ] **Tenant Isolation**: Create invoices/clients for Tenant A, verify Tenant B cannot see them
- [ ] **User Isolation**: Users from Tenant A cannot access Tenant B's data
- [ ] **Settings Isolation**: Each tenant has their own settings
- [ ] **Token Validation**: Tokens include `tenantId` and all queries filter by it
- [ ] **Superadmin Access**: Superadmin can create other users in their tenant
- [ ] **Data Scoping**: All CRUD operations respect `tenantId` from the token

---

## Security Notes

1. **Onboarding Endpoints**: The `/onboard-superadmin` and `/onboard-settings` endpoints are **unauthenticated** by design. In production, consider:
   - Rate limiting
   - IP whitelisting
   - Admin approval workflow
   - Email verification

2. **Tenant ID in Tokens**: The JWT token includes `tenantId`. Never trust client-provided `tenantId` - always use the one from the token.

3. **First User Protection**: The onboarding endpoint only works if the tenant has **zero users**. This prevents unauthorized user creation.

---

## Troubleshooting

### Error: "Tenant already has users"
- **Cause**: You're trying to use the onboarding endpoint but the tenant already has users.
- **Solution**: Use the regular authenticated user creation endpoint: `POST /api/user` (requires auth token)

### Error: "Settings already exist for this tenant"
- **Cause**: Settings were already created for this tenant.
- **Solution**: Use the update endpoint: `PUT /api/settings` (requires auth token)

### Error: "Tenant not found"
- **Cause**: The `tenantId` provided doesn't exist.
- **Solution**: Verify the `_id` from Step 1 is correct (it's a MongoDB ObjectId string)

---

## Complete Example Flow

```bash
# 1. Create tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "subdomain": "acme"
  }'

# Response: { "_id": "6852eb75de523aa426a43743", ... }

# 2. Create superadmin (use _id from step 1)
curl -X POST http://localhost:3000/api/users/onboard-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "6852eb75de523aa426a43743",
    "email": "admin@acme.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'

# 3. Create settings
curl -X POST http://localhost:3000/api/settings/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "6852eb75de523aa426a43743",
    "domain": "acme.com",
    "tenantNumber": 1001,
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "gstNumber": "29AABCU9603R1ZX"
  }'

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePass123!"
  }'
```

---

## Next Steps

After onboarding:
1. Login with the superadmin credentials
2. Create additional users via `POST /api/user` (authenticated)
3. Configure additional settings via `PUT /api/settings` (authenticated)
4. Start creating invoices, clients, and other tenant-specific data

