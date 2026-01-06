# Vendor Bill PDF Upload Implementation

## Storage Approach

**✅ MongoDB Binary Storage (Implemented)**
- **Entire PDF stored in MongoDB** as Binary data (Buffer)
- PDF data stored in `attachments[].data` field
- File metadata stored in `attachments` array
- **Why this approach?**
  - ✅ Complete data in one place - no file system dependencies
  - ✅ Automatic backup with MongoDB backups
  - ✅ No file path management needed
  - ✅ Works well for PDFs up to 10MB
  - ✅ Data is excluded from default queries (using `select: false`) for performance

**Note:** For files >16MB, consider MongoDB GridFS, but for PDFs this approach is perfect.

---

## API Endpoints

### 1. **Upload PDF** - `POST /api/vendor-bills/:id/upload`

**Request:**
```
Method: POST
URL: {{baseURL}}/api/vendor-bills/{{vendorBillId}}/upload
Headers:
  Authorization: Bearer {{token}}
  Content-Type: multipart/form-data

Body (form-data):
  pdf: <file> (PDF file, max 10MB)
```

**Response:**
```json
{
  "success": true,
  "message": "PDF uploaded successfully",
  "vendorBill": {
    "_id": "...",
    "attachments": [
      {
        "_id": 0,
        "name": "bill.pdf",
        "url": "/api/vendor-bills/123/download/0",
        "type": "pdf",
        "size": 245678,
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    ...
  }
}
```

**Postman Setup:**
1. Method: `POST`
2. URL: `{{baseURL}}/api/vendor-bills/{{vendorBillId}}/upload`
3. Body → form-data
4. Key: `pdf` (type: File)
5. Value: Select PDF file
6. Headers: `Authorization: Bearer {{token}}`

---

### 2. **Download PDF** - `GET /api/vendor-bills/:id/download/:attachmentId`

**Request:**
```
Method: GET
URL: {{baseURL}}/api/vendor-bills/{{vendorBillId}}/download/{{attachmentId}}
Headers:
  Authorization: Bearer {{token}}
```

**Response:**
- Returns PDF file as download
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="bill.pdf"`

**Example:**
```
GET /api/vendor-bills/690cdc26cb7cbba3500f91b6/download/0
```

---

### 3. **Delete Attachment** - `DELETE /api/vendor-bills/:id/attachments/:attachmentId`

**Request:**
```
Method: DELETE
URL: {{baseURL}}/api/vendor-bills/{{vendorBillId}}/attachments/{{attachmentId}}
Headers:
  Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

---

## File Storage Details

### Storage Method
- **MongoDB Binary Storage** - Entire PDF stored as Buffer in MongoDB
- No file system storage needed
- PDF data stored in `attachments[].data` field

### File Size Limit
- **10MB** maximum per file
- Configured in `middleware/upload.js`
- MongoDB document size limit is 16MB, so this is safe

### File Validation
- ✅ Only PDF files allowed
- ✅ Validates MIME type: `application/pdf`
- ✅ Validates file extension: `.pdf`

---

## Database Schema

### VendorBill Model - Attachments Array
```javascript
attachments: [
  {
    name: String,           // Original filename
    url: String,            // Download URL
    data: Buffer,           // ✅ PDF file data stored in MongoDB (excluded from default queries)
    contentType: String,    // "application/pdf"
    type: String,          // "pdf"
    size: Number,          // File size in bytes
    uploadedAt: Date,      // Upload timestamp
    uploadedBy: ObjectId   // User who uploaded
  }
]
```

**Important:** The `data` field uses `select: false` to exclude it from default queries for performance. It's only loaded when explicitly requested (e.g., for download).

---

## Frontend Implementation

### Upload PDF (React Example)
```javascript
const uploadPDF = async (vendorBillId, file) => {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(
    `${API_URL}/api/vendor-bills/${vendorBillId}/upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    }
  );

  const data = await response.json();
  return data;
};
```

### Download PDF
```javascript
const downloadPDF = async (vendorBillId, attachmentId) => {
  const response = await fetch(
    `${API_URL}/api/vendor-bills/${vendorBillId}/download/${attachmentId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bill_${attachmentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

### Display Attachments
```javascript
{vendorBill.attachments.map((attachment, index) => (
  <div key={index}>
    <span>{attachment.name}</span>
    <span>{(attachment.size / 1024).toFixed(2)} KB</span>
    <button onClick={() => downloadPDF(vendorBill._id, index)}>
      Download
    </button>
    <button onClick={() => deleteAttachment(vendorBill._id, index)}>
      Delete
    </button>
  </div>
))}
```

---

## Security Features

1. ✅ **Authentication Required** - All endpoints require valid JWT token
2. ✅ **Tenant Isolation** - Users can only access their tenant's vendor bills
3. ✅ **File Type Validation** - Only PDFs allowed
4. ✅ **File Size Limit** - 10MB maximum
5. ✅ **Sanitized Filenames** - Special characters removed from filenames
6. ✅ **Error Cleanup** - Failed uploads delete the file automatically

---

## Error Handling

### Common Errors

**400 - No file uploaded:**
```json
{
  "success": false,
  "message": "No PDF file uploaded"
}
```

**400 - Invalid file type:**
```json
{
  "error": "Only PDF files are allowed"
}
```

**404 - Vendor bill not found:**
```json
{
  "success": false,
  "message": "Vendor bill not found"
}
```

**404 - Attachment not found:**
```json
{
  "success": false,
  "message": "Attachment not found"
}
```

---

## Postman Collection

### Upload PDF
```
POST {{baseURL}}/api/vendor-bills/{{vendorBillId}}/upload
Authorization: Bearer {{token}}

Body (form-data):
  Key: pdf
  Type: File
  Value: [Select PDF file]
```

### Download PDF
```
GET {{baseURL}}/api/vendor-bills/{{vendorBillId}}/download/0
Authorization: Bearer {{token}}
```

### Delete Attachment
```
DELETE {{baseURL}}/api/vendor-bills/{{vendorBillId}}/attachments/0
Authorization: Bearer {{token}}
```

---

## File Management

### Backup Strategy
- Files are stored in `/uploads/vendor-bills/`
- Include this directory in your backup strategy
- Consider syncing to cloud storage for production

### Cleanup
- Files are automatically deleted when:
  - Upload fails
  - Attachment is deleted via DELETE endpoint
- Manual cleanup may be needed for orphaned files

### Production Considerations
1. **Use Cloud Storage** (S3, Google Cloud Storage) for scalability
2. **CDN** for faster file delivery
3. **File compression** for large PDFs
4. **Virus scanning** for uploaded files
5. **Rate limiting** on upload endpoint

---

## Testing Checklist

- [ ] Upload PDF successfully
- [ ] Download PDF successfully
- [ ] Delete attachment successfully
- [ ] Verify tenant isolation (can't access other tenant's files)
- [ ] Test file size limit (10MB)
- [ ] Test invalid file type rejection
- [ ] Test multiple attachments per vendor bill
- [ ] Verify file cleanup on error
- [ ] Test with missing vendor bill ID

