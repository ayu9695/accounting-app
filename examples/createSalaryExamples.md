# Manual Salary Creation Examples

## Method 1: Create Single Salary Record

### Basic Salary (No Allowances/Deductions)
```bash
curl -X POST http://localhost:3000/api/salaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "507f1f77bcf86cd799439011",
    "month": "December",
    "year": 2025
  }'
```

### Salary with Allowances Only
```bash
curl -X POST http://localhost:3000/api/salaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "507f1f77bcf86cd799439011",
    "month": "December",
    "year": 2025,
    "allowances": [
      {
        "name": "Transport",
        "amount": 5000,
        "type": "fixed"
      },
      {
        "name": "HRA",
        "amount": 20,
        "type": "percentage"
      }
    ]
  }'
```

### Salary with Allowances and Deductions
```bash
curl -X POST http://localhost:3000/api/salaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "507f1f77bcf86cd799439011",
    "month": "December",
    "year": 2025,
    "allowances": [
      {
        "name": "Transport",
        "amount": 5000,
        "type": "fixed"
      },
      {
        "name": "HRA",
        "amount": 20,
        "type": "percentage"
      }
    ],
    "deductions": [
      {
        "name": "Provident Fund",
        "amount": 12,
        "type": "percentage"
      },
      {
        "name": "Income Tax",
        "amount": 5000,
        "type": "fixed"
      }
    ],
    "leaveDays": 2,
    "workingDays": 28
  }'
```

## Method 2: Bulk Create for All Employees

### Create Salaries for All Active Employees (December 2025)
```bash
curl -X POST http://localhost:3000/api/salaries/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "period": "122025"
  }'
```

**Period Format:**
- `MMYYYY` where MM = month (01-12), YYYY = year
- Examples:
  - `122025` = December 2025
  - `012025` = January 2025
  - `112025` = November 2025

## Method 3: Update Existing Salary with Allowances/Deductions

```bash
curl -X PUT http://localhost:3000/api/salaries/SALARY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "allowances": [
      {
        "name": "Bonus",
        "amount": 10000,
        "type": "fixed"
      }
    ],
    "deductions": [
      {
        "name": "Advance Deduction",
        "amount": 2000,
        "type": "fixed"
      }
    ]
  }'
```

## Calculation Examples

### Example 1: Base Salary Only
- Base Salary: ₹50,000
- Allowances: None
- Deductions: None
- **Result:**
  - Gross Salary: ₹50,000
  - Net Salary: ₹50,000

### Example 2: With Percentage Allowances/Deductions
- Base Salary: ₹50,000
- Allowances: HRA 20% = ₹10,000
- Deductions: PF 12% = ₹6,000
- **Result:**
  - Gross Salary: ₹60,000 (50,000 + 10,000)
  - Net Salary: ₹54,000 (60,000 - 6,000)

### Example 3: Mixed Fixed and Percentage
- Base Salary: ₹50,000
- Allowances:
  - Transport: ₹5,000 (fixed)
  - HRA: 20% = ₹10,000
- Deductions:
  - PF: 12% = ₹6,000
  - Tax: ₹3,000 (fixed)
- **Result:**
  - Gross Salary: ₹65,000 (50,000 + 5,000 + 10,000)
  - Net Salary: ₹56,000 (65,000 - 6,000 - 3,000)

## Response Format

```json
{
  "_id": "...",
  "employeeId": "...",
  "employeeName": "John Doe",
  "month": "December",
  "year": 2025,
  "baseSalary": 50000,
  "allowances": 15000,
  "deductions": 6000,
  "grossSalary": 65000,
  "netSalary": 59000,
  "status": "pending",
  "salaryPaymentDate": 1,
  "paymentDate": "2026-01-01T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

