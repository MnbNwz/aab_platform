# 🔐 Admin User Management API Documentation

**For Frontend Development Team**

## 📋 Overview
Complete API documentation for Admin User Management functionality. All endpoints require admin authentication.

---

## 🔑 Authentication Requirements
```
Headers: {
  'Cookie': 'accessToken=<jwt_token>'  // Set via login
}
```

**Base URL:** `/api/admin/users`

---

## 📊 1. User Statistics Dashboard

### **GET** `/api/admin/users/stats`
Get comprehensive user statistics for admin dashboard.

**Response:**
```json
{
  "message": "User statistics retrieved successfully",
  "stats": {
    "totalUsers": 15,
    "activeUsers": 8,
    "pendingUsers": 5,
    "revokedUsers": 2,
    "customers": 7,
    "contractors": 6,
    "admins": 2
  }
}
```

**Use Case:** Dashboard overview widgets, charts, and statistics displays.

---

## 👥 2. Get Users with Advanced Filtering

### **GET** `/api/admin/users`
Primary endpoint for user management with comprehensive filtering, sorting, and pagination.

### **Query Parameters:**

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `page` | number | 1, 2, 3... | Page number (default: 1) |
| `limit` | number | 5, 10, 20, 50 | Items per page (default: 10) |
| `role` | string | `customer`, `contractor`, `admin` | Filter by user role |
| `status` | string | `pending`, `active`, `revoke` | Filter by user status |
| `approval` | string | `pending`, `approved`, `rejected` | Filter by approval status |
| `search` | string | any text | Search in email or phone |
| `startDate` | string | ISO date | Filter from date |
| `endDate` | string | ISO date | Filter to date |
| `sortBy` | string | `createdAt`, `updatedAt`, `email` | Sort field |
| `sortOrder` | string | `asc`, `desc` | Sort direction |

### **Example Requests:**

**1. Pending Approvals Queue:**
```
GET /api/admin/users?status=pending&approval=pending&sortBy=createdAt&sortOrder=asc&page=1&limit=20
```

**2. Active Customers Dashboard:**
```
GET /api/admin/users?role=customer&status=active&approval=approved&page=1&limit=15
```

**3. Search Users by Email:**
```
GET /api/admin/users?search=@gmail.com&page=1&limit=10
```

**4. All Contractors:**
```
GET /api/admin/users?role=contractor&page=1&limit=10
```

### **Response Structure:**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "_id": "64a8f9b2c1d2e3f4a5b6c7d8",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "status": "pending",
      "approval": "pending",
      "geoHome": {
        "type": "Point",
        "coordinates": [-74.006, 40.7128]
      },
      "customer": {
        "defaultPropertyType": "domestic"
      },
      "createdAt": "2024-07-07T10:30:00.000Z",
      "updatedAt": "2024-07-07T10:30:00.000Z"
    }
    // ... more users
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 47,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 10
  }
}
```

---

## 👤 3. Get Single User Details

### **GET** `/api/admin/users/:userId`
Get detailed information for a specific user.

**URL Parameter:**
- `userId` - User's MongoDB ObjectId

**Response:**
```json
{
  "message": "User retrieved successfully",
  "user": {
    "_id": "64a8f9b2c1d2e3f4a5b6c7d8",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@contractcorp.com",
    "phone": "+1987654321",
    "role": "contractor",
    "status": "pending",
    "approval": "pending",
    "geoHome": {
      "type": "Point",
      "coordinates": [-74.006, 40.7128]
    },
    "contractor": {
      "companyName": "Smith Contracting LLC",
      "services": ["plumbing", "electrical", "hvac"],
      "license": "LIC123456",
      "taxId": "TAX789012",
      "docs": [
        {"type": "license", "url": "https://example.com/license.pdf"},
        {"type": "insurance", "url": "https://example.com/insurance.pdf"}
      ]
    },
    "createdAt": "2024-07-07T10:30:00.000Z",
    "updatedAt": "2024-07-07T10:30:00.000Z"
  }
}
```

---

## ✅ 4. Update User Status/Approval

### **PUT** `/api/admin/users/:userId`
Update user's status and approval. **Key Change:** Approval is now at user level, not profile level.

### **Request Body Structure:**
```json
{
  "status": "active",      // Optional: "pending", "active", "revoke"
  "approval": "approved"   // Optional: "pending", "approved", "rejected"
}
```

### **Common Update Scenarios:**

**1. Approve User (Recommended):**
```json
{
  "status": "active",
  "approval": "approved"
}
```

**2. Reject User:**
```json
{
  "approval": "rejected"
}
```

**3. Activate Pending User:**
```json
{
  "status": "active"
}
```

**4. Deactivate User:**
```json
{
  "status": "pending"
}
```

### **Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    // Updated user object
  }
}
```

---

## 🗑️ 5. Revoke User (Soft Delete)

### **DELETE** `/api/admin/users/:userId`
Soft delete a user by setting status to "revoke". This preserves data for audit purposes.

**Response:**
```json
{
  "message": "User revoked successfully"
}
```

---

## 🔄 6. User States & Workflow

### **User Status Values:**
- `pending` - Newly registered, awaiting admin action
- `active` - Approved and can use the platform
- `revoke` - Deactivated/banned user

### **Approval Values:**
- `pending` - Awaiting admin approval decision
- `approved` - Admin has approved the user
- `rejected` - Admin has rejected the user

### **Recommended Approval Workflow:**
1. **New Registration** → `status: "pending"`, `approval: "pending"`
2. **Admin Approves** → `status: "active"`, `approval: "approved"`
3. **Admin Rejects** → `status: "pending"`, `approval: "rejected"`
4. **Admin Revokes** → `status: "revoke"` (via DELETE endpoint)

---

## 📱 7. Frontend Implementation Examples

### **User Management Table:**
```javascript
// Fetch users with pagination
const fetchUsers = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
    ...filters
  });
  
  const response = await fetch(`/api/admin/users?${params}`, {
    credentials: 'include' // Include cookies
  });
  
  return await response.json();
};

// Approve user
const approveUser = async (userId) => {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      status: 'active',
      approval: 'approved'
    })
  });
  
  return await response.json();
};
```

### **Dashboard Statistics:**
```javascript
// Fetch dashboard stats
const fetchStats = async () => {
  const response = await fetch('/api/admin/users/stats', {
    credentials: 'include'
  });
  
  const data = await response.json();
  return data.stats;
};
```

### **Search Functionality:**
```javascript
// Search users by email/phone
const searchUsers = async (searchTerm) => {
  const params = new URLSearchParams({
    search: searchTerm,
    page: '1',
    limit: '20'
  });
  
  const response = await fetch(`/api/admin/users?${params}`, {
    credentials: 'include'
  });
  
  return await response.json();
};
```

---

## ⚠️ Important Notes

1. **Authentication:** All endpoints require admin role and valid JWT cookie
2. **User-Level Approval:** Approval field moved from profile to user level
3. **Soft Delete:** DELETE endpoint doesn't remove data, just sets status to "revoke"
4. **Password Security:** Password hash is never returned in responses
5. **Services Validation:** Contractor services are validated against `/api/services` endpoint
6. **Pagination:** Always implement pagination for better performance
7. **Error Handling:** Handle 401 (unauthorized), 403 (forbidden), and 404 (not found) responses

---

## 🚀 Quick Integration Checklist

- [ ] Implement user statistics dashboard
- [ ] Create user management table with filtering
- [ ] Add pagination controls
- [ ] Implement user approval/rejection actions
- [ ] Add search functionality
- [ ] Handle user status indicators
- [ ] Implement user detail view
- [ ] Add bulk operations (if needed)
- [ ] Implement proper error handling
- [ ] Add loading states and feedback

---

**Need Help?** Check the Postman collection for detailed examples and test all endpoints before frontend implementation.
