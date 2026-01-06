# Salary Cronjob - Data Created

## Overview
The salary cronjob runs automatically on the **1st, 15th, and 27th** of each month to create/update salary records.

---

## Cronjob Schedule

### 1. **1st of Month @ 00:00** - Initial Salary Calculation
- **Purpose**: Creates new salary records for the current month
- **Function**: `processSalaryForPeriod(monthName, year, false)`
- **Behavior**: Creates records for all active employees

### 2. **15th of Month @ 00:00** - Mid-Month Recalculation
- **Purpose**: Updates existing unpaid salary records
- **Function**: `processSalaryForPeriod(monthName, year, true)`
- **Behavior**: Only updates records that are NOT paid

### 3. **27th of Month @ 00:00** - Final Recalculation
- **Purpose**: Final update before month-end
- **Function**: `processSalaryForPeriod(monthName, year, true)`
- **Behavior**: Only updates records that are NOT paid

---

## Data Created on 1st of Month (Initial Calculation)

When the cronjob runs on the 1st, it creates salary records with:

```javascript
{
  tenantId: <from employee>,
  employeeId: <from employee>,
  employeeName: <from employee.name>,
  month: "December", // Current month name
  year: 2025,        // Current year
  baseSalary: <from employee.baseSalary>,
  allowances: 0,           // ✅ Default: 0
  reimbursements: 0,       // ✅ Default: 0 (NEW)
  deductions: 0,           // ✅ Default: 0
  grossSalary: baseSalary, // ✅ = baseSalary + 0 allowances
  netSalary: baseSalary,   // ✅ = grossSalary + 0 reimbursements - 0 deductions
  status: 'pending',
  salaryPaymentDate: <from employee.salaryPaymentDate or 1>,
  paymentDate: <calculated from salaryPaymentDate>,
  defaultWorkingDays: <calculated for the month>,
  createdAt: <current date>,
  updatedAt: <current date>
}
```

**Key Points:**
- ✅ All financial fields start at **0** (allowances, reimbursements, deductions)
- ✅ `grossSalary` = `baseSalary` (since allowances = 0)
- ✅ `netSalary` = `baseSalary` (since reimbursements = 0, deductions = 0)
- ✅ `reimbursements` field is now included (defaults to 0)

---

## Data Updated on 15th/27th (Recalculation)

When the cronjob runs on 15th/27th, it **updates existing unpaid records**:

```javascript
{
  employeeName: <updated from employee.name>,
  baseSalary: <updated from employee.baseSalary>,
  grossSalary: <recalculated>,  // ✅ = baseSalary + existing allowances
  netSalary: <recalculated>,    // ✅ = grossSalary + existing reimbursements - existing deductions
  salaryPaymentDate: <updated>,
  paymentDate: <recalculated>,
  defaultWorkingDays: <updated>,
  updatedAt: <current date>
}
```

**Key Points:**
- ✅ **Preserves** existing `allowances`, `reimbursements`, and `deductions` (doesn't overwrite with 0)
- ✅ **Recalculates** `grossSalary` and `netSalary` based on:
  - New `baseSalary` (from employee)
  - Existing `allowances` (preserved)
  - Existing `reimbursements` (preserved)
  - Existing `deductions` (preserved)
- ✅ **Skips** records with `status === 'paid'` (doesn't modify paid salaries)

---

## Calculation Logic

### Initial Creation (1st of month):
```
allowances = 0
reimbursements = 0
deductions = 0
grossSalary = baseSalary + allowances = baseSalary
netSalary = grossSalary + reimbursements - deductions = baseSalary
```

### Recalculation (15th/27th):
```
// Uses existing values from the salary record
grossSalary = baseSalary + existingAllowances
netSalary = grossSalary + existingReimbursements - existingDeductions
```

---

## What Gets Updated Manually

After the cronjob creates the initial records, you can manually update:

1. **Allowances** - via `PUT /api/salaries/:id` or `POST /api/salaries`
2. **Reimbursements** - via `PUT /api/salaries/:id` or `POST /api/salaries`
3. **Deductions** - via `PUT /api/salaries/:id` or `POST /api/salaries`

When you update these fields, the system automatically recalculates:
- `grossSalary` = `baseSalary + allowances`
- `netSalary` = `grossSalary + reimbursements - deductions`

---

## Example Flow

### December 1st (Cronjob runs):
```javascript
// Creates record
{
  baseSalary: 50000,
  allowances: 0,
  reimbursements: 0,
  deductions: 0,
  grossSalary: 50000,  // 50000 + 0
  netSalary: 50000     // 50000 + 0 - 0
}
```

### December 5th (Manual update via API):
```javascript
// User updates with:
{
  allowances: [{ amount: 5000, type: 'fixed' }],
  reimbursements: [{ amount: 3000, type: 'fixed' }],
  deductions: [{ amount: 2000, type: 'fixed' }]
}

// System calculates:
{
  allowances: 5000,
  reimbursements: 3000,
  deductions: 2000,
  grossSalary: 55000,  // 50000 + 5000
  netSalary: 56000     // 55000 + 3000 - 2000
}
```

### December 15th (Cronjob recalculation):
```javascript
// Cronjob updates baseSalary if employee.baseSalary changed
// But preserves allowances/reimbursements/deductions
// Recalculates grossSalary and netSalary

// If employee.baseSalary changed to 52000:
{
  baseSalary: 52000,     // Updated
  allowances: 5000,     // Preserved
  reimbursements: 3000,  // Preserved
  deductions: 2000,      // Preserved
  grossSalary: 57000,    // Recalculated: 52000 + 5000
  netSalary: 58000       // Recalculated: 57000 + 3000 - 2000
}
```

---

## Important Notes

1. **Cronjob only uses `baseSalary`** - It doesn't read allowances/reimbursements/deductions from Employee model
2. **Manual updates required** - Allowances/reimbursements/deductions must be added via API
3. **Recalculation preserves manual changes** - 15th/27th runs don't overwrite your manual updates
4. **Paid records are protected** - Once a salary is marked as 'paid', cronjob skips it
5. **Reimbursements field** - Now included in all calculations (defaults to 0 if not provided)

---

## Fields Summary

| Field | Initial Value (1st) | Updated On Recalc (15th/27th) | Source |
|-------|---------------------|-------------------------------|--------|
| `baseSalary` | From employee | From employee | Employee model |
| `allowances` | 0 | Preserved | Manual update |
| `reimbursements` | 0 | Preserved | Manual update |
| `deductions` | 0 | Preserved | Manual update |
| `grossSalary` | baseSalary | Recalculated | Calculated |
| `netSalary` | baseSalary | Recalculated | Calculated |
| `defaultWorkingDays` | Calculated | Updated | Calculated |
| `paymentDate` | Calculated | Updated | Calculated |

