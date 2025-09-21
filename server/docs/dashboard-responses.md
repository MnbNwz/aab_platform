# 📊 Dashboard API - Exact Response Examples

## Single Endpoint: `GET /api/dashboard/platform`

This endpoint returns different data based on the authenticated user's role. Here are the **exact responses** your frontend will receive:

---

## 🔴 ADMIN RESPONSE

When an **admin user** calls the endpoint:

```json
{
  "success": true,
  "data": {
    "userRole": "admin",
    "userId": "64f123456789abcdef123456",
    "isAdmin": true,
    "description": "Complete platform analytics and insights",
    "platform": {
      "jobs": {
        "totalJobs": 1247,
        "openJobs": 45,
        "inProgressJobs": 23,
        "completedJobs": 1156,
        "cancelledJobs": 23,
        "totalValue": 3450000,
        "avgJobValue": 2767,
        "totalBids": 5234,
        "avgBidsPerJob": 4.2,
        "monthlyJobs": [
          { "month": 9, "year": 2025, "status": "completed", "value": 5000 },
          { "month": 8, "year": 2025, "status": "open", "value": 3500 }
        ],
        "serviceBreakdown": [
          { "service": "plumbing", "estimate": 2500, "status": "completed" },
          { "service": "electrical", "estimate": 3000, "status": "open" }
        ]
      },
      "users": {
        "totalUsers": 1696,
        "totalApproved": 1596,
        "totalPending": 85,
        "totalRejected": 15,
        "roles": [
          {
            "role": "customer",
            "count": 1240,
            "approved": 1198,
            "pending": 42,
            "rejected": 0,
            "monthlyRegistrations": [{ "month": 9, "year": 2025, "approval": "approved" }]
          },
          {
            "role": "contractor",
            "count": 456,
            "approved": 398,
            "pending": 43,
            "rejected": 15,
            "monthlyRegistrations": [{ "month": 9, "year": 2025, "approval": "pending" }]
          }
        ]
      },
      "payments": {
        "totalPayments": 2341,
        "totalAmount": 4580000,
        "successfulPayments": 2198,
        "failedPayments": 23,
        "pendingPayments": 120,
        "avgPaymentAmount": 1956,
        "monthlyRevenue": [
          { "month": 9, "year": 2025, "amount": 450000, "status": "succeeded" },
          { "month": 8, "year": 2025, "amount": 380000, "status": "succeeded" }
        ],
        "paymentMethods": [
          { "method": "card", "amount": 3200000, "status": "succeeded" },
          { "method": "bank_transfer", "amount": 1380000, "status": "succeeded" }
        ]
      },
      "memberships": {
        "totalMemberships": 1000,
        "totalRevenue": 60000,
        "membershipBreakdown": [
          {
            "planName": "Basic",
            "tier": "basic",
            "status": "active",
            "count": 600,
            "totalRevenue": 18000,
            "avgDuration": 2592000000
          },
          {
            "planName": "Premium",
            "tier": "premium",
            "status": "active",
            "count": 200,
            "totalRevenue": 36000,
            "avgDuration": 5184000000
          }
        ]
      },
      "bids": {
        "totalBids": 5234,
        "acceptedBids": 1156,
        "pendingBids": 892,
        "rejectedBids": 3186,
        "avgBidAmount": 3200,
        "totalBidValue": 16748800,
        "serviceBids": [
          { "service": "plumbing", "bidAmount": 2500, "status": "accepted" },
          { "service": "electrical", "bidAmount": 3200, "status": "pending" }
        ],
        "monthlyBids": [
          { "month": 9, "year": 2025, "amount": 280000, "status": "accepted" },
          { "month": 8, "year": 2025, "amount": 320000, "status": "accepted" }
        ]
      },
      "recentActivity": [
        {
          "type": "payment_processed",
          "createdAt": "2025-09-21T11:45:00.000Z",
          "amount": 5000,
          "status": "succeeded"
        },
        {
          "type": "bid_placed",
          "createdAt": "2025-09-21T11:30:00.000Z",
          "bidAmount": 3200,
          "status": "pending"
        },
        {
          "type": "user_registration",
          "createdAt": "2025-09-21T11:15:00.000Z",
          "email": "newcontractor@example.com",
          "role": "contractor"
        }
      ]
    },
    "summary": {
      "totalJobs": 1247,
      "totalUsers": 1696,
      "totalRevenue": 4580000,
      "totalMemberships": 1000,
      "healthScore": 87.5
    },
    "period": {
      "current": {
        "month": 9,
        "year": 2025
      },
      "description": "Current month statistics"
    },
    "timestamp": "2025-09-21T12:00:00.000Z"
  }
}
```

---

## 🟡 CONTRACTOR RESPONSE

When a **contractor user** calls the endpoint:

```json
{
  "success": true,
  "data": {
    "userRole": "contractor",
    "userId": "64f123456789abcdef123460",
    "isContractor": true,
    "description": "Contractor performance metrics and lead analytics",
    "contractor": {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@contractor.com",
      "contractor": {
        "company": "Smith Construction LLC",
        "services": ["plumbing", "electrical"],
        "license": "LIC123456",
        "taxId": "TAX789012"
      },
      "membership": {
        "plan": {
          "name": "Premium",
          "tier": "premium"
        },
        "status": "active",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.000Z"
      },
      "biddingStats": {
        "totalBids": 45,
        "acceptedBids": 12,
        "pendingBids": 8,
        "rejectedBids": 25,
        "winRate": 26.67,
        "avgBidAmount": 3450
      },
      "earningsStats": {
        "totalEarnings": 41400,
        "completedJobs": 12,
        "avgJobValue": 3450,
        "totalJobValue": 48000
      },
      "leadStats": {
        "monthlyUsed": 15,
        "monthlyLimit": -1,
        "monthlyRemaining": -1,
        "membershipTier": "premium"
      },
      "recentBids": [
        {
          "_id": "64f123456789abcdef123461",
          "bidAmount": 4500,
          "status": "accepted",
          "message": "I can complete this within 2 weeks with premium materials",
          "timeline": {
            "startDate": "2025-09-25T00:00:00.000Z",
            "endDate": "2025-10-09T00:00:00.000Z"
          },
          "job": {
            "title": "Bathroom Renovation",
            "service": "renovation",
            "estimate": 5000,
            "status": "inprogress",
            "createdAt": "2025-09-18T10:00:00.000Z"
          },
          "createdAt": "2025-09-20T15:30:00.000Z"
        },
        {
          "_id": "64f123456789abcdef123462",
          "bidAmount": 2800,
          "status": "pending",
          "message": "Professional electrical work with 2-year warranty",
          "job": {
            "title": "Electrical Panel Upgrade",
            "service": "electrical",
            "estimate": 3000,
            "status": "open"
          },
          "createdAt": "2025-09-19T09:15:00.000Z"
        }
      ],
      "recentWonJobs": [
        {
          "_id": "64f123456789abcdef123463",
          "title": "Kitchen Renovation",
          "service": "renovation",
          "estimate": 5000,
          "status": "completed",
          "acceptedBid": {
            "bidAmount": 4750
          },
          "createdAt": "2025-09-15T10:30:00.000Z"
        },
        {
          "_id": "64f123456789abcdef123464",
          "title": "Plumbing Repair",
          "service": "plumbing",
          "estimate": 800,
          "status": "completed",
          "acceptedBid": {
            "bidAmount": 750
          },
          "createdAt": "2025-09-10T14:20:00.000Z"
        }
      ]
    },
    "timestamp": "2025-09-21T12:00:00.000Z"
  }
}
```

---

## 🔵 CUSTOMER RESPONSE

When a **customer user** calls the endpoint:

```json
{
  "success": true,
  "data": {
    "userRole": "customer",
    "userId": "64f123456789abcdef123456",
    "isCustomer": true,
    "description": "Customer job and payment analytics",
    "customer": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@customer.com",
      "membership": {
        "plan": {
          "name": "Standard",
          "tier": "standard"
        },
        "status": "active",
        "startDate": "2025-01-15T00:00:00.000Z",
        "endDate": "2025-12-31T23:59:59.000Z"
      },
      "jobStats": {
        "totalJobs": 8,
        "openJobs": 2,
        "completedJobs": 5,
        "totalValue": 23400,
        "avgJobValue": 2925,
        "totalBids": 34,
        "avgBidsPerJob": 4.25
      },
      "paymentStats": {
        "totalPayments": 15,
        "totalAmount": 23400,
        "successfulPayments": 14,
        "avgPaymentAmount": 1560
      },
      "propertyStats": {
        "totalProperties": 3,
        "totalJobsAcrossProperties": 8,
        "avgJobsPerProperty": 2.67
      },
      "recentJobs": [
        {
          "_id": "64f123456789abcdef123457",
          "title": "Kitchen Renovation",
          "description": "Complete kitchen remodel with new cabinets and appliances",
          "status": "completed",
          "estimate": 5000,
          "bidCount": 6,
          "avgBidAmount": 4750,
          "acceptedBid": {
            "bidAmount": 4750,
            "contractor": "64f123456789abcdef123460"
          },
          "property": {
            "title": "Main House",
            "propertyType": "domestic"
          },
          "createdAt": "2025-09-15T10:30:00.000Z"
        },
        {
          "_id": "64f123456789abcdef123458",
          "title": "Bathroom Tile Repair",
          "description": "Fix cracked tiles in master bathroom",
          "status": "open",
          "estimate": 800,
          "bidCount": 3,
          "avgBidAmount": 750,
          "property": {
            "title": "Main House",
            "propertyType": "domestic"
          },
          "createdAt": "2025-09-20T08:45:00.000Z"
        }
      ],
      "recentPayments": [
        {
          "_id": "64f123456789abcdef123459",
          "amount": 5000,
          "status": "succeeded",
          "paymentMethod": "card",
          "paymentType": "completion",
          "job": {
            "title": "Kitchen Renovation",
            "service": "renovation"
          },
          "createdAt": "2025-09-16T14:20:00.000Z"
        },
        {
          "_id": "64f123456789abcdef123460",
          "amount": 1200,
          "status": "succeeded",
          "paymentMethod": "card",
          "paymentType": "deposit",
          "job": {
            "title": "Bathroom Tile Repair",
            "service": "repair"
          },
          "createdAt": "2025-09-20T10:30:00.000Z"
        }
      ],
      "recentProperties": [
        {
          "_id": "64f123456789abcdef123461",
          "title": "Main House",
          "description": "Primary residence - 3 bedroom, 2 bathroom house",
          "propertyType": "domestic",
          "address": "123 Main St, Anytown, State 12345",
          "totalJobs": 5,
          "createdAt": "2025-08-01T09:00:00.000Z"
        },
        {
          "_id": "64f123456789abcdef123462",
          "title": "Rental Property #1",
          "description": "Investment property - 2 bedroom apartment",
          "propertyType": "commercial",
          "address": "456 Oak Ave, Anytown, State 12345",
          "totalJobs": 2,
          "createdAt": "2025-08-15T11:30:00.000Z"
        }
      ]
    },
    "timestamp": "2025-09-21T12:00:00.000Z"
  }
}
```

---

## 🎯 Frontend Integration Examples

### TypeScript Interface

```typescript
interface DashboardResponse {
  success: boolean;
  data: {
    userRole: "admin" | "contractor" | "customer";
    userId: string;
    timestamp: string;
    description: string;

    // Only ONE of these will be present based on role:
    isAdmin?: boolean;
    isContractor?: boolean;
    isCustomer?: boolean;

    // Admin gets 'platform' object
    platform?: AdminPlatformData;
    summary?: PlatformSummary;
    period?: PlatformPeriod;

    // Contractor gets 'contractor' object
    contractor?: ContractorData;

    // Customer gets 'customer' object
    customer?: CustomerData;
  };
}
```

### React Component Example

```typescript
const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/platform', {
          credentials: 'include'
        });
        const data = await response.json();
        setDashboard(data);
      } catch (error) {
        console.error('Dashboard fetch failed:', error);
      }
    };

    fetchDashboard();
  }, []);

  if (!dashboard?.success) return <div>Loading...</div>;

  const { userRole, data } = dashboard;

  // Render based on user role
  switch(userRole) {
    case 'admin':
      return <AdminDashboard platform={data.platform} summary={data.summary} />;
    case 'contractor':
      return <ContractorDashboard contractor={data.contractor} />;
    case 'customer':
      return <CustomerDashboard customer={data.customer} />;
    default:
      return <div>Invalid user role</div>;
  }
};
```

### Vue.js Example

```typescript
// composables/useDashboard.ts
export const useDashboard = () => {
  const dashboard = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const fetchDashboard = async () => {
    try {
      loading.value = true;
      const response = await $fetch('/api/dashboard/platform');
      dashboard.value = response;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  return { dashboard, loading, error, fetchDashboard };
};

// In component:
const { dashboard, loading, fetchDashboard } = useDashboard();

// Template
<template>
  <div v-if="loading">Loading dashboard...</div>
  <AdminDashboard v-else-if="dashboard.data.isAdmin" :data="dashboard.data.platform" />
  <ContractorDashboard v-else-if="dashboard.data.isContractor" :data="dashboard.data.contractor" />
  <CustomerDashboard v-else-if="dashboard.data.isCustomer" :data="dashboard.data.customer" />
</template>
```

---

## 🔧 Important Notes for Frontend Team

### Data Structure Rules:

1. **Always check `userRole`** to determine which data object is present
2. **Only ONE data object** will be present (`platform` OR `contractor` OR `customer`)
3. **Role indicators** (`isAdmin`, `isContractor`, `isCustomer`) help with conditional rendering
4. **All monetary values** are in cents (divide by 100 for display)
5. **All dates** are in ISO 8601 format (UTC)
6. **Arrays are pre-sorted** by creation date (newest first)

### Error Handling:

```typescript
const handleDashboardError = (error: any) => {
  if (error.status === 401) {
    // User not authenticated - redirect to login
    window.location.href = "/login";
  } else if (error.status === 403) {
    // Invalid role or permissions
    showError("Access denied");
  } else if (error.status === 404) {
    // User data not found
    showError("Dashboard data unavailable");
  } else {
    // Server error
    showError("Unable to load dashboard");
  }
};
```

This documentation provides **exact response structures** your frontend team can rely on! 🎯
