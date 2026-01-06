# Frontend API Changes - PaymentMethod & Department Migration

## Overview
All `paymentMethod` fields have been converted from **string/enum** to **ObjectId references**.  
All `department` fields have been converted to **ObjectId references** (already were in some places).

---

## 📋 API Endpoints - Response Changes

### 1. **Expenses APIs**

#### `GET /api/expenses`
**Response Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer"  // string
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  paymentMethodName: null,  // ⚠️ May be null (backend only populates 'code')
  // ... other fields
}
```

#### `GET /api/expenses/:id`
**Response Changed:** Same as above

#### `GET /api/expenses/filter/unpaid`
**Response Changed:** Same as above

---

### 2. **Vendor Bills APIs**

#### `GET /api/vendor-bills`
**Response Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer"  // string enum
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  paymentMethodName: null,  // ⚠️ May be null (backend only populates 'code')
  // ... other fields
}
```

#### `GET /api/vendor-bills/:id`
**Response Changed:** Same as above

---

### 3. **Invoices APIs**

#### `GET /api/invoices`
**Response Changed:**
```javascript
// ❌ OLD
{
  paymentHistory: [{
    paymentMethod: "bank_transfer"  // string
  }]
}

// ✅ NEW
{
  paymentHistory: [{
    paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
    // paymentMethod is populated with { _id, code }
    // ... other fields
  }]
}
```

#### `GET /api/invoices/:invoiceNumber`
**Response Changed:** Same as above

#### `GET /api/invoices/filter/by-date`
**Response Changed:** Same as above

#### `GET /api/invoices/client/:clientName`
**Response Changed:** Same as above

---

### 4. **Salaries APIs**

#### `GET /api/salaries`
**Response Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer"  // string
}

// ✅ NEW
{
  paymentMethod: {  // Populated object
    _id: "507f1f77bcf86cd799439011",
    code: "BANK_TRANSFER"
  },
  // ... other fields
}
```

#### `GET /api/salaries/filter/unpaid`
**Response Changed:** Same as above

#### `GET /api/salaries/:period`
**Response Changed:** Same as above

---

### 5. **Clients APIs**

#### `GET /api/clients`
**Response Changed:**
```javascript
// ❌ OLD (if it was string)
{
  department: "Engineering"  // string
}

// ✅ NEW
{
  department: {  // Populated object
    _id: "507f1f77bcf86cd799439011",
    name: "Engineering"
  },
  // ... other fields
}
```

#### `GET /api/clients/:name`
**Response Changed:** Same as above

#### `GET /api/clients-with-contacts`
**Response Changed:** Same as above

---

### 6. **Settings APIs**

#### `GET /api/settings`
**Response Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer"  // string enum
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string (not populated in response)
  // ... other fields
}
```

---

## 📤 API Endpoints - Request Body Changes

### 1. **Expenses APIs**

#### `POST /api/expenses`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string
  // ... other fields
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  // ... other fields
}
```

#### `PUT /api/expenses/:id`
**Request Body Changed:** Same as above

---

### 2. **Vendor Bills APIs**

#### `POST /api/vendor-bills`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string enum
  // ... other fields
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  // ... other fields
}
```

#### `PUT /api/vendor-bills/:id`
**Request Body Changed:** Same as above

#### `PUT /api/vendor-bills/payment/:id`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string enum
  paidAmount: 1000,
  paymentReference: "REF123"
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  paidAmount: 1000,
  paymentReference: "REF123"
}
```

---

### 3. **Invoices APIs**

#### `PUT /api/invoices/payment/:id`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string
  paidAmount: 1000,
  reference: "REF123",
  notes: "Payment notes"
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  paidAmount: 1000,
  reference: "REF123",
  notes: "Payment notes"
}
```

---

### 4. **Salaries APIs**

#### `PUT /api/salaries/:id/mark-paid`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string
  paidOn: "2024-01-15",
  paymentReference: "REF123",
  // ... other fields
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  paidOn: "2024-01-15",
  paymentReference: "REF123",
  // ... other fields
}
```

#### `PUT /api/salaries/bulk/mark-paid`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string (default for all)
  salaries: [
    {
      salaryId: "...",
      paymentMethod: "cash",  // string (overrides default)
      paymentReference: "REF123"
    }
  ]
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string (default for all)
  salaries: [
    {
      salaryId: "...",
      paymentMethod: "507f1f77bcf86cd799439012",  // ObjectId string (overrides default)
      paymentReference: "REF123"
    }
  ]
}
```

---

### 5. **Clients APIs**

#### `POST /api/clients`
**Request Body Changed:**
```javascript
// ❌ OLD (if it was string)
{
  department: "Engineering",  // string
  // ... other fields
}

// ✅ NEW
{
  department: "507f1f77bcf86cd799439011",  // ObjectId string
  // ... other fields
}
```

#### `PUT /api/clients/:id`
**Request Body Changed:** Same as above

---

### 6. **Settings APIs**

#### `PUT /api/settings`
**Request Body Changed:**
```javascript
// ❌ OLD
{
  paymentMethod: "bank_transfer",  // string enum
  // ... other fields
}

// ✅ NEW
{
  paymentMethod: "507f1f77bcf86cd799439011",  // ObjectId string
  // ... other fields
}
```

---

## 🔧 Frontend Implementation Guide

### Step 1: Fetch PaymentMethods & Departments

**Before any form submission, fetch the lists:**

```javascript
// Fetch PaymentMethods
const paymentMethods = await fetch('/api/paymentMethods', {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json());

// Fetch Departments
const departments = await fetch('/api/departments', {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => res.json());
```

**Response Format:**
```javascript
// PaymentMethods
[
  {
    id: "507f1f77bcf86cd799439011",
    code: "BANK_TRANSFER",
    name: "Bank Transfer",
    description: "Bank transfer payment method"
  }
]

// Departments
[
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Engineering",
    description: "Engineering department"
  }
]
```

### Step 2: Update Forms

**Replace string inputs with dropdowns:**

```javascript
// ❌ OLD - Text input or hardcoded enum
<input type="text" name="paymentMethod" value="bank_transfer" />

// ✅ NEW - Dropdown with PaymentMethod options
<select name="paymentMethod">
  <option value="">Select Payment Method</option>
  {paymentMethods.map(pm => (
    <option key={pm.id} value={pm.id}>
      {pm.name}
    </option>
  ))}
</select>
```

### Step 3: Update Display Components

**For PaymentMethod display:**

```javascript
// Option A: Use paymentMethodName if available
<div>{expense.paymentMethodName || 'N/A'}</div>

// Option B: Lookup from PaymentMethod list (recommended)
const getPaymentMethodName = (paymentMethodId) => {
  const pm = paymentMethods.find(p => p.id === paymentMethodId);
  return pm?.name || 'N/A';
};

<div>{getPaymentMethodName(expense.paymentMethod)}</div>
```

**For Department display:**

```javascript
// ❌ OLD
<div>{client.department}</div>

// ✅ NEW
<div>{client.department?.name || 'N/A'}</div>
```

### Step 4: Update TypeScript Interfaces (if using TypeScript)

```typescript
// Old
interface Expense {
  paymentMethod: string;
  department?: string;
}

// New
interface Expense {
  paymentMethod: string | null;  // ObjectId string
  paymentMethodName?: string | null;
  department?: {
    _id: string;
    name: string;
  } | null;
}

interface Invoice {
  paymentHistory: Array<{
    paymentMethod: string | null;  // ObjectId string
    // ... other fields
  }>;
}

interface Salary {
  paymentMethod: {
    _id: string;
    code: string;
  } | null;
}
```

---

## ⚠️ Important Notes

1. **paymentMethodName may be null**: The backend currently only populates `code`, not `name`, so `paymentMethodName` will be `null`. You should:
   - Fetch PaymentMethods list and do a lookup, OR
   - Request backend to populate both `name` and `code`

2. **Always send ObjectId strings**: Never send payment method names/codes in request bodies. Always send the ObjectId string.

3. **Handle null values**: Both `paymentMethod` and `department` can be `null`/`undefined`. Always check before accessing.

4. **Invoice paymentHistory**: The `paymentMethod` in `paymentHistory` is populated with `{ _id, code }`, not `name`. You'll need to lookup the name from your PaymentMethods list.

5. **Salaries response**: Salaries return `paymentMethod` as a populated object `{ _id, code }`, not as a string.

---

## 📝 Checklist

- [ ] Update all Expense forms to use PaymentMethod dropdown
- [ ] Update all Vendor Bill forms to use PaymentMethod dropdown
- [ ] Update all Invoice payment forms to use PaymentMethod dropdown
- [ ] Update all Salary payment forms to use PaymentMethod dropdown
- [ ] Update all Client forms to use Department dropdown
- [ ] Update all display components for PaymentMethod
- [ ] Update all display components for Department
- [ ] Update TypeScript interfaces (if applicable)
- [ ] Test all create/update endpoints
- [ ] Test all GET endpoints to verify response structure
- [ ] Handle null/undefined cases gracefully
- [ ] Add PaymentMethod and Department lookup utilities

---

## 🔍 Testing Endpoints

Use these endpoints to verify the changes:

1. **Get PaymentMethods**: `GET /api/paymentMethods`
2. **Get Departments**: `GET /api/departments`
3. **Create Expense**: `POST /api/expenses` (with paymentMethod ObjectId)
4. **Get Expenses**: `GET /api/expenses` (verify response structure)
5. **Create Invoice Payment**: `PUT /api/invoices/payment/:id` (with paymentMethod ObjectId)
6. **Get Invoices**: `GET /api/invoices` (verify paymentHistory structure)

---

## 🐛 Known Issues

1. **Backend Issue**: `paymentMethodName` is always `null` because backend only populates `code`. Consider:
   - Option A: Update backend to populate `'name code'` instead of just `'code'`
   - Option B: Always do a lookup from PaymentMethods list in frontend

---

## 📞 Support

If you encounter any issues, check:
1. Request body contains ObjectId strings (not names/codes)
2. Response parsing handles new structure
3. Null/undefined checks are in place
4. PaymentMethods and Departments are fetched before rendering forms

