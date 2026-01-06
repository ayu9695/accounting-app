# Postman Requests: Update Vendor Bill PaymentMethod to ObjectId

## Step 1: Get PaymentMethod ObjectId

First, fetch all payment methods to get the ObjectId:

### Request: Get Payment Methods
```
Method: GET
URL: {{baseUrl}}/api/paymentMethods
Headers:
  Authorization: Bearer {{your_token}}
```

**Response Example:**
```json
[
  {
    "id": "691758459a939eabfe861091",
    "code": "BANK_TRANSFER",
    "name": "Bank Transfer",
    "description": "Bank transfer payment method"
  },
  {
    "id": "691758459a939eabfe861092",
    "code": "CASH",
    "name": "Cash",
    "description": "Cash payment"
  }
]
```

**Note:** Use the `id` field (ObjectId string) in your update request.

---

## Step 2: Update Vendor Bill PaymentMethod

### Option A: General Update (PUT /api/vendor-bills/:id)

Use this endpoint to update paymentMethod along with other fields:

```
Method: PUT
URL: {{baseUrl}}/api/vendor-bills/{{vendorBillId}}
Headers:
  Authorization: Bearer {{your_token}}
  Content-Type: application/json

Body (raw JSON):
{
  "paymentMethod": "691756331fba9aa8872ad73d"
}

{
    "vendorId": "687e862bcf990d52626a23b8",
    "vendorName": "Demo Vendor",
    "billNumber": "DEMO/2025/001",
    "billDate": "2025-11-06",
    "totalAmount": 11800,
    "amount": 20000,
    "cgst": 9,
    "sgst": 9,
    "igst": 0,
    "tdsRate": 0,
    "tdsAmount": 0,
    "payableAmount": 11800,
    "department": "",
    "description": "",
    "fileName": "",
    "_id": "690cdc26cb7cbba3500f91b6"
}
```

**Full Example with Multiple Fields:**
```json
{
  "paymentMethod": "691758459a939eabfe861091",
  "paymentReference": "REF123456",
  "paymentDate": "2024-01-15T00:00:00.000Z",
  "notes": "Updated payment method"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor bill updated successfully",
  "vendorBill": {
    "_id": "...",
    "paymentMethod": "691758459a939eabfe861091",
    "paymentMethodName": null,
    "paymentReference": "REF123456",
    ...
  }
}
```

---

### Option B: Payment Update (PUT /api/vendor-bills/payment/:id)

Use this endpoint specifically for payment-related updates:

```
Method: PUT
URL: {{baseUrl}}/api/vendor-bills/payment/{{vendorBillId}}
Headers:
  Authorization: Bearer {{your_token}}
  Content-Type: application/json

Body (raw JSON):
{
  "paymentMethod": "691758459a939eabfe861091",
  "paidAmount": 1000,
  "paymentReference": "REF123456"
}
```

**Full Example:**
```json
{
  "paymentMethod": "691758459a939eabfe861091",
  "paidAmount": 5000,
  "paymentReference": "TXN-2024-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor bill updated successfully",
  "vendorBill": {
    "_id": "...",
    "paymentMethod": "691758459a939eabfe861091",
    "paymentMethodName": null,
    "paidAmount": 5000,
    "pendingAmount": 0,
    "paymentStatus": "paid",
    ...
  }
}
```

---

## Postman Collection Setup

### Environment Variables
Create these variables in your Postman environment:
- `baseUrl`: `http://localhost:3000` (or your server URL)
- `your_token`: Your JWT authentication token
- `vendorBillId`: The ID of the vendor bill you want to update
- `paymentMethodId`: The ObjectId of the payment method (from Step 1)

### Collection Requests

#### 1. Get Payment Methods
```
GET {{baseUrl}}/api/paymentMethods
Authorization: Bearer {{your_token}}
```

#### 2. Update Vendor Bill PaymentMethod (General)
```
PUT {{baseUrl}}/api/vendor-bills/{{vendorBillId}}
Authorization: Bearer {{your_token}}
Content-Type: application/json

{
  "paymentMethod": "{{paymentMethodId}}"
}
```

#### 3. Update Vendor Bill Payment (Payment Endpoint)
```
PUT {{baseUrl}}/api/vendor-bills/payment/{{vendorBillId}}
Authorization: Bearer {{your_token}}
Content-Type: application/json

{
  "paymentMethod": "{{paymentMethodId}}",
  "paidAmount": 1000,
  "paymentReference": "REF123"
}
```

---

## Migration Script (if needed)

If you need to bulk update existing vendor bills that have string paymentMethod values, you can use this MongoDB script:

```javascript
// MongoDB Shell Script
// Connect to your database first

// Get all payment methods
const paymentMethods = db.paymentmethods.find({}).toArray();
const paymentMethodMap = {};

// Create a map of name/code to ObjectId
paymentMethods.forEach(pm => {
  paymentMethodMap[pm.name] = pm._id;
  paymentMethodMap[pm.code] = pm._id;
});

// Update vendor bills
db.vendorbills.find({ paymentMethod: { $type: "string" } }).forEach(bill => {
  const oldValue = bill.paymentMethod;
  const newObjectId = paymentMethodMap[oldValue];
  
  if (newObjectId) {
    db.vendorbills.updateOne(
      { _id: bill._id },
      { $set: { paymentMethod: newObjectId } }
    );
    print(`Updated bill ${bill.billNumber}: ${oldValue} -> ${newObjectId}`);
  } else {
    print(`WARNING: Could not find payment method for: ${oldValue}`);
  }
});
```

---

## Common Issues

### Issue 1: "Invalid ObjectId"
**Error:** `CastError: Cast to ObjectId failed`
**Solution:** Make sure you're using the exact ObjectId string from the PaymentMethod response (the `id` field), not the name or code.

### Issue 2: "PaymentMethod not found"
**Error:** The ObjectId doesn't exist in PaymentMethods collection
**Solution:** Verify the ObjectId exists by calling `GET /api/paymentMethods` first.

### Issue 3: "Vendor bill not found"
**Error:** The vendorBillId is incorrect or doesn't belong to your tenant
**Solution:** Verify the vendor bill ID and ensure you're authenticated with the correct tenant.

---

## Testing Checklist

- [ ] Get payment methods list
- [ ] Copy a valid paymentMethod ObjectId
- [ ] Update vendor bill with ObjectId
- [ ] Verify response shows updated paymentMethod
- [ ] Check that paymentMethodName is populated (if backend populates 'name')
- [ ] Test with invalid ObjectId to verify error handling

