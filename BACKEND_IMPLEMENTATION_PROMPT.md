# 🍕 Complete Backend Implementation Prompt for Pizza Management System

## 📋 Project Overview

You are implementing a **complete, production-ready backend API** for a **Domino's-style Pizza Management System**. The frontend is already built with React + Redux and expects specific API endpoints. Your task is to create all missing backend routes, controllers, and ensure proper integration with existing models.

---

## 🏗️ Current Backend Architecture

### Existing Structure

```
backend/
├── config/
│   ├── db.js (MongoDB connection)
│   └── stripe.js (Stripe payment config)
├── controllers/ (✅ 8 existing)
│   ├── authController.js ✅
│   ├── branchController.js ✅
│   ├── cartController.js ✅
│   ├── menuController.js ✅
│   ├── orderController.js ✅
│   ├── paymentController.js ✅ (needs enhancement)
│   ├── riderController.js ✅
│   └── userController.js ✅
├── middleware/
│   ├── asyncHandler.js ✅
│   ├── authMiddleware.js ✅
│   ├── errorHandler.js ✅
│   └── roleMiddleware.js ✅
├── models/ (✅ 7 existing)
│   ├── User.js ✅
│   ├── Order.js ✅
│   ├── Menu.js ✅
│   ├── Branch.js ✅
│   ├── Cart.js ✅
│   ├── Payment.js ✅
│   └── DeliveryRider.js ✅
├── routes/ (✅ 8 existing)
│   ├── authRoutes.js ✅
│   ├── branchRoutes.js ✅
│   ├── cartRoutes.js ✅
│   ├── menuRoutes.js ✅
│   ├── orderRoutes.js ✅
│   ├── paymentRoutes.js ✅
│   ├── riderRoutes.js ✅
│   └── userRoutes.js ✅
└── server.js ✅
```

### Technology Stack
- **Runtime**: Node.js (ES6 Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Stripe (optional)
- **Real-time**: Socket.io (already configured)
- **Error Handling**: Custom asyncHandler middleware

---

## 🎯 Implementation Requirements

### **CRITICAL RULES:**
1. ✅ Use **ES6 module syntax** (`import/export`)
2. ✅ Use **asyncHandler** for all async route handlers
3. ✅ Follow existing code patterns and structure
4. ✅ All routes must use **protect** middleware (authentication)
5. ✅ Use role-based access control where needed (admin, staff, branchManager)
6. ✅ Return consistent response format: `{ success: true, data: ... }`
7. ✅ Handle errors properly with status codes
8. ✅ Include proper validation and error messages
9. ✅ Use Mongoose models with proper relationships
10. ✅ Add pagination, filtering, and sorting where appropriate

---

## 📦 MISSING MODELS TO CREATE

Create these Mongoose models in `/backend/models/`:

### 1. **Inventory.js**
```javascript
- itemId (ref: Menu, required)
- branchId (ref: Branch, required)
- quantity (Number, required, min: 0)
- minStockLevel (Number, default: 10)
- maxStockLevel (Number, default: 100)
- unit (String: 'piece', 'kg', 'liter')
- costPerUnit (Number)
- supplier (String)
- location (String)
- lastRestocked (Date)
- timestamps
```

### 2. **Ingredient.js**
```javascript
- name (String, required, unique)
- category (String: 'vegetable', 'meat', 'cheese', 'sauce', 'dough', 'other')
- unit (String)
- pricePerUnit (Number)
- supplier (ref: Supplier)
- allergenInfo ([String])
- expiryDate (Date)
- isAvailable (Boolean, default: true)
- timestamps
```

### 3. **Supplier.js**
```javascript
- name (String, required, unique)
- contactPerson (String)
- email (String)
- phone (String)
- address (Object)
- rating (Number, 1-5)
- isActive (Boolean, default: true)
- paymentTerms (String)
- timestamps
```

### 4. **StockMovement.js**
```javascript
- inventoryId (ref: Inventory, required)
- branchId (ref: Branch, required)
- movementType (enum: 'purchase', 'sale', 'transfer', 'adjustment', 'waste')
- quantity (Number, required)
- referenceOrder (ref: Order, optional)
- performedBy (ref: User, required)
- notes (String)
- timestamps
```

### 5. **Campaign.js**
```javascript
- name (String, required)
- description (String)
- campaignType (enum: 'email', 'sms', 'push', 'banner', 'social')
- startDate (Date, required)
- endDate (Date, required)
- status (enum: 'draft', 'active', 'paused', 'completed', 'ended')
- targetAudience (enum: 'all', 'new', 'regular', 'vip')
- budget (Number)
- branches ([ref: Branch])
- featuredItems ([ref: Menu])
- content (Object: subject, title, message, imageUrl, linkUrl)
- metrics (Object: sent, opened, clicked, converted)
- createdBy (ref: User)
- timestamps
```

### 6. **LoyaltyProgram.js**
```javascript
- userId (ref: User, required, unique)
- points (Number, default: 0, min: 0)
- tier (enum: 'bronze', 'silver', 'gold', 'platinum')
- totalOrders (Number, default: 0)
- totalSpent (Number, default: 0)
- pointsHistory ([Object: points, reason, date])
- expiryDate (Date)
- timestamps
```

### 7. **Notification.js**
```javascript
- userId (ref: User, optional - null for broadcast)
- title (String, required)
- message (String, required)
- type (enum: 'order', 'promotion', 'system', 'loyalty', 'reminder')
- channel (enum: 'push', 'email', 'sms', 'in-app')
- status (enum: 'pending', 'sent', 'read', 'failed')
- orderId (ref: Order, optional)
- campaignId (ref: Campaign, optional)
- readAt (Date)
- sentAt (Date)
- timestamps
```

### 8. **Shift.js**
```javascript
- userId (ref: User, required)
- branchId (ref: Branch, required)
- shiftDate (Date, required)
- startTime (Date, required)
- endTime (Date, required)
- status (enum: 'scheduled', 'in-progress', 'completed', 'cancelled')
- breakDuration (Number, minutes)
- actualStartTime (Date)
- actualEndTime (Date)
- notes (String)
- timestamps
```

### 9. **Task.js**
```javascript
- title (String, required)
- description (String)
- assignedTo (ref: User, required)
- branchId (ref: Branch, required)
- priority (enum: 'low', 'medium', 'high', 'urgent')
- status (enum: 'pending', 'in-progress', 'completed', 'cancelled')
- dueDate (Date)
- completedAt (Date)
- orderId (ref: Order, optional)
- timestamps
```

### 10. **Attendance.js**
```javascript
- userId (ref: User, required)
- branchId (ref: Branch, required)
- shiftId (ref: Shift, optional)
- date (Date, required)
- checkInTime (Date)
- checkOutTime (Date)
- status (enum: 'present', 'absent', 'late', 'half-day')
- lateMinutes (Number)
- overtimeHours (Number)
- notes (String)
- timestamps
```

### 11. **Review.js**
```javascript
- userId (ref: User, required)
- orderId (ref: Order, required)
- menuId (ref: Menu, optional)
- branchId (ref: Branch, optional)
- rating (Number, 1-5, required)
- comment (String)
- status (enum: 'pending', 'approved', 'rejected', 'flagged')
- helpfulCount (Number, default: 0)
- adminResponse (String)
- respondedBy (ref: User)
- respondedAt (Date)
- timestamps
```

### 12. **Complaint.js**
```javascript
- userId (ref: User, required)
- orderId (ref: Order, optional)
- branchId (ref: Branch, optional)
- subject (String, required)
- description (String, required)
- category (enum: 'food-quality', 'delivery', 'service', 'payment', 'other')
- priority (enum: 'low', 'medium', 'high', 'urgent')
- status (enum: 'open', 'in-progress', 'resolved', 'closed')
- assignedTo (ref: User, optional)
- resolution (String)
- resolvedAt (Date)
- resolvedBy (ref: User)
- timestamps
```

### 13. **Expense.js**
```javascript
- branchId (ref: Branch, required)
- category (enum: 'ingredients', 'utilities', 'rent', 'salaries', 'marketing', 'equipment', 'maintenance', 'other')
- amount (Number, required, min: 0)
- description (String, required)
- receiptUrl (String)
- supplierId (ref: Supplier, optional)
- status (enum: 'pending', 'approved', 'rejected', 'paid')
- approvedBy (ref: User)
- approvedAt (Date)
- rejectedBy (ref: User)
- rejectedAt (Date)
- rejectionReason (String)
- createdBy (ref: User, required)
- expenseDate (Date, required)
- timestamps
```

### 14. **Refund.js**
```javascript
- orderId (ref: Order, required)
- paymentId (ref: Payment, required)
- userId (ref: User, required)
- amount (Number, required, min: 0)
- reason (String, required)
- status (enum: 'pending', 'processing', 'completed', 'rejected', 'cancelled')
- refundMethod (enum: 'original', 'cash', 'bank-transfer')
- transactionId (String)
- processedBy (ref: User)
- processedAt (Date)
- completedAt (Date)
- notes (String)
- timestamps
```

### 15. **Settings.js**
```javascript
- key (String, required, unique)
- value (Mixed, required)
- type (enum: 'string', 'number', 'boolean', 'json', 'array')
- category (String: 'general', 'payment', 'delivery', 'notification', 'loyalty', 'tax', 'other')
- branchId (ref: Branch, optional - null for global settings)
- description (String)
- isActive (Boolean, default: true)
- updatedBy (ref: User)
- timestamps
```

### 16. **Category.js**
```javascript
- name (String, required, unique)
- description (String)
- parentCategory (ref: Category, optional - for hierarchy)
- branchId (ref: Branch, optional - null for global)
- displayOrder (Number, default: 0)
- isActive (Boolean, default: true)
- taxRate (Number, default: 0)
- imageUrl (String)
- timestamps
```

### 17. **SalesReport.js** (Optional - for pre-calculated reports)
```javascript
- reportType (enum: 'daily', 'weekly', 'monthly', 'yearly')
- periodStart (Date, required)
- periodEnd (Date, required)
- branchId (ref: Branch, optional)
- totalOrders (Number)
- totalRevenue (Number)
- topSellingItems ([Object])
- orderStatusDistribution (Object)
- paymentMethodDistribution (Object)
- timestamps
```

### 18. **CustomerAnalytics.js** (Optional - for customer insights)
```javascript
- userId (ref: User, required, unique)
- totalOrders (Number, default: 0)
- totalSpent (Number, default: 0)
- averageOrderValue (Number)
- favoriteItems ([ref: Menu])
- segment (enum: 'new', 'regular', 'vip', 'churned')
- churnRisk (enum: 'low', 'medium', 'high')
- lastOrderDate (Date)
- firstOrderDate (Date)
- customerLifetimeValue (Number)
- timestamps
```

### 19. **OrderMetrics.js** (Optional - for performance tracking)
```javascript
- date (Date, required)
- branchId (ref: Branch, optional)
- orderCount (Number)
- averagePreparationTime (Number, minutes)
- averageDeliveryTime (Number, minutes)
- onTimeDeliveryRate (Number, percentage)
- cancellationRate (Number, percentage)
- peakHours ([Object])
- timestamps
```

---

## 🛣️ MISSING ROUTES & CONTROLLERS TO CREATE

### **1. INVENTORY MODULE** (`/api/inventory`)

**Routes needed:**
- `GET /api/inventory` - Get all inventory items (with filtering: branchId, lowStock, search)
- `GET /api/inventory/:id` - Get single inventory item
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/stats` - Get inventory statistics (low stock alerts, total value)

**Controller Functions:**
```javascript
// inventoryController.js
- getInventory (with filters: branchId, lowStock, search, pagination)
- getInventoryItem
- createInventoryItem (validate menu item exists, check duplicates)
- updateInventoryItem (update quantity, trigger stock movement)
- deleteInventoryItem
- getInventoryStats (low stock count, total value, alerts)
```

**Additional Routes:**
- `GET /api/ingredients` - Get all ingredients
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

- `GET /api/stock-movements` - Get stock movement history (with filters)
- `POST /api/stock-movements` - Record stock movement (auto-update inventory)

---

### **2. ANALYTICS MODULE** (`/api/analytics`)

**Routes needed:**
- `GET /api/analytics/sales-reports` - Get sales reports (query: reportType, dateRange, branchId)
- `GET /api/analytics/order-metrics` - Get order performance metrics (query: dateRange, branchId)
- `GET /api/analytics/customer-stats` - Get customer statistics (query: dateRange)
- `GET /api/analytics/dashboard` - Get dashboard summary (today stats, monthly stats, top items)

**Controller Functions:**
```javascript
// analyticsController.js
- getSalesReports (calculate from Order model: totalRevenue, totalOrders, topSellingItems, orderStatusDistribution, paymentMethodDistribution)
- getOrderMetrics (average prep time, delivery time, on-time rate, cancellation rate, peak hours)
- getCustomerStats (active customers, growth rate, segment distribution)
- getDashboardAnalytics (today stats, monthly stats, revenue trends, top items)
```

**Data Flow:**
- Aggregate data from Order, Payment, User models
- Support date range filtering (thisWeek, lastWeek, thisMonth, lastMonth)
- Calculate real-time metrics (no pre-calculated reports needed initially)
- Return formatted data ready for charts

---

### **3. MARKETING MODULE** (`/api/campaigns`, `/api/loyalty-programs`, `/api/notifications`)

**Campaign Routes:**
- `GET /api/campaigns` - Get all campaigns (filter: status, campaignType, dateRange)
- `GET /api/campaigns/:id` - Get single campaign
- `POST /api/campaigns` - Create campaign (admin only)
- `PUT /api/campaigns/:id` - Update campaign (admin only)
- `DELETE /api/campaigns/:id` - Delete campaign (admin only)
- `POST /api/campaigns/:id/activate` - Activate campaign
- `POST /api/campaigns/:id/pause` - Pause campaign

**Loyalty Program Routes:**
- `GET /api/loyalty-programs` - Get all loyalty programs
- `GET /api/loyalty-programs/:userId` - Get user's loyalty program
- `PUT /api/loyalty-programs/:userId` - Update loyalty points (add/subtract)
- `POST /api/loyalty-programs/:userId/points` - Add points with reason

**Notification Routes:**
- `GET /api/notifications` - Get notifications (filter: userId, type, status, unread)
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id` - Update notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read for user

**Controller Functions:**
```javascript
// marketingController.js
- getCampaigns (with filters and pagination)
- getCampaign
- createCampaign (validate dates, budget, target audience)
- updateCampaign
- deleteCampaign
- activateCampaign
- pauseCampaign

- getLoyaltyPrograms
- getLoyaltyProgram (by userId)
- updateLoyaltyProgram (add/subtract points, update tier)
- addLoyaltyPoints (with transaction history)

- getNotifications (with filters)
- createNotification (support broadcast to all users)
- updateNotification
- markNotificationRead
- markAllNotificationsRead
```

**Business Logic:**
- When order is completed, automatically add loyalty points (1 point per 100 rupees spent)
- Update loyalty tier based on total points/spending
- Send notifications when campaigns are active
- Track campaign metrics (sent, opened, clicked)

---

### **4. OPERATIONS MODULE** (`/api/shifts`, `/api/tasks`, `/api/attendance`)

**Shift Routes:**
- `GET /api/shifts` - Get all shifts (filter: userId, branchId, date, status)
- `GET /api/shifts/:id` - Get single shift
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift
- `PUT /api/shifts/:id/start` - Start shift (set actualStartTime)
- `PUT /api/shifts/:id/end` - End shift (set actualEndTime)

**Task Routes:**
- `GET /api/tasks` - Get all tasks (filter: assignedTo, branchId, status, priority)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as completed

**Attendance Routes:**
- `GET /api/attendance` - Get attendance records (filter: userId, branchId, date, status)
- `POST /api/attendance/check-in` - Record check-in
- `POST /api/attendance/check-out` - Record check-out
- `PUT /api/attendance/:id` - Update attendance record

**Controller Functions:**
```javascript
// operationsController.js
- getShifts (with filters, pagination)
- getShift
- createShift (validate user, branch, time conflicts)
- updateShift
- deleteShift
- startShift (set status to 'in-progress', record actualStartTime)
- endShift (set status to 'completed', record actualEndTime)

- getTasks (with filters, pagination)
- getTask
- createTask (validate assignedTo, branchId)
- updateTask
- deleteTask
- completeTask (set status to 'completed', record completedAt)

- getAttendance (with filters)
- checkIn (create attendance record, link to shift if exists)
- checkOut (update attendance record, calculate hours, detect late)
- updateAttendance
```

**Business Logic:**
- Check for shift conflicts when creating shifts
- Calculate late minutes if check-in is after shift start time
- Calculate overtime if check-out is after shift end time
- Auto-update shift status when attendance is recorded

---

### **5. QUALITY MODULE** (`/api/reviews`, `/api/complaints`)

**Review Routes:**
- `GET /api/reviews` - Get all reviews (filter: orderId, menuId, branchId, status, rating)
- `GET /api/reviews/:id` - Get single review
- `POST /api/reviews` - Create review (from customer)
- `PUT /api/reviews/:id/status` - Update review status (approve/reject/flag) - admin only
- `POST /api/reviews/:id/respond` - Add admin response to review
- `POST /api/reviews/:id/helpful` - Mark review as helpful

**Complaint Routes:**
- `GET /api/complaints` - Get all complaints (filter: userId, orderId, branchId, status, priority)
- `GET /api/complaints/:id` - Get single complaint
- `POST /api/complaints` - Create complaint (from customer)
- `PUT /api/complaints/:id` - Update complaint
- `PUT /api/complaints/:id/assign` - Assign complaint to staff member
- `PUT /api/complaints/:id/resolve` - Resolve complaint (add resolution, set status)

**Controller Functions:**
```javascript
// qualityController.js
- getReviews (with filters, pagination, sorting by rating/date)
- getReview
- createReview (validate order exists, user owns order, prevent duplicates)
- updateReviewStatus (admin only: approve, reject, flag)
- respondToReview (admin only: add response)
- markReviewHelpful

- getComplaints (with filters, pagination, sorting by priority/date)
- getComplaint
- createComplaint (validate order if provided)
- updateComplaint
- assignComplaint (validate assignedTo is staff/admin)
- resolveComplaint (add resolution, set resolvedAt, resolvedBy)
```

**Business Logic:**
- Auto-approve reviews with rating >= 4, flag reviews with rating <= 2 for review
- Send notification to branch manager when complaint is created
- Update complaint priority based on category and order value
- Track average rating per menu item and branch

---

### **6. FINANCIAL MODULE** (`/api/expenses`, `/api/refunds`)

**Expense Routes:**
- `GET /api/expenses` - Get all expenses (filter: branchId, category, status, dateRange)
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense (status: pending)
- `PUT /api/expenses/:id` - Update expense (only if pending)
- `PUT /api/expenses/:id/approve` - Approve expense (admin/branchManager only)
- `PUT /api/expenses/:id/reject` - Reject expense (admin/branchManager only, require reason)
- `DELETE /api/expenses/:id` - Delete expense (only if pending)

**Refund Routes:**
- `GET /api/refunds` - Get all refunds (filter: orderId, userId, status, dateRange)
- `GET /api/refunds/:id` - Get single refund
- `POST /api/refunds` - Create refund request (status: pending)
- `PUT /api/refunds/:id/process` - Process refund (admin only, update payment status)
- `PUT /api/refunds/:id/complete` - Mark refund as completed
- `PUT /api/refunds/:id/reject` - Reject refund request

**Controller Functions:**
```javascript
// financialController.js
- getExpenses (with filters, pagination, sorting)
- getExpense
- createExpense (validate branchId, category, amount > 0)
- updateExpense (only if status is 'pending')
- approveExpense (admin/branchManager only, set approvedBy, approvedAt)
- rejectExpense (admin/branchManager only, require rejectionReason, set rejectedBy, rejectedAt)
- deleteExpense (only if status is 'pending')

- getRefunds (with filters, pagination)
- getRefund
- createRefund (validate order exists, payment exists, amount <= payment amount)
- processRefund (admin only: update payment status, create refund record, process Stripe refund if applicable)
- completeRefund (mark as completed, update order status)
- rejectRefund (require reason)
```

**Business Logic:**
- Expenses require approval workflow (pending → approved/rejected)
- Refunds must be linked to valid payment
- Process Stripe refunds if payment was made via Stripe
- Update order payment status when refund is processed
- Calculate total expenses per branch/category for reporting

---

### **7. SYSTEM MODULE** (`/api/settings`, `/api/categories`)

**Settings Routes:**
- `GET /api/settings` - Get all settings (filter: category, branchId, isActive)
- `GET /api/settings/:key` - Get setting by key (with branchId for branch-specific)
- `POST /api/settings` - Create setting (admin only)
- `PUT /api/settings/:key` - Update setting (admin only, support branchId for branch-specific)
- `DELETE /api/settings/:key` - Delete setting (admin only)

**Category Routes:**
- `GET /api/categories` - Get all categories (filter: branchId, isActive, parentCategory)
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only, check if used by menu items)

**Controller Functions:**
```javascript
// systemController.js
- getSettings (with filters, merge global and branch-specific)
- getSetting (by key, with branchId priority: branch-specific > global)
- createSetting (validate key uniqueness, type validation)
- updateSetting (validate type, update updatedBy)
- deleteSetting

- getCategories (with filters, support hierarchical structure)
- getCategory
- createCategory (validate name uniqueness, parentCategory exists if provided)
- updateCategory (validate parentCategory doesn't create circular reference)
- deleteCategory (check if used by menu items, prevent deletion if in use)
```

**Business Logic:**
- Settings can be global (branchId: null) or branch-specific
- When fetching setting, prioritize branch-specific over global
- Categories support hierarchy (parentCategory)
- Prevent category deletion if menu items are using it
- Validate setting value type matches defined type

---

### **8. PAYMENT MODULE ENHANCEMENTS** (Already exists, needs enhancement)

**Additional Routes Needed:**
- `GET /api/payments/stats` - Get payment statistics (already exists, verify it works)
- `PATCH /api/payments/:id/status` - Update payment status (add if missing)
- `POST /api/payments/:id/refund` - Process refund (already exists, verify integration)

**Enhancement Requirements:**
- Ensure `getPayments` supports filtering (status, paymentMethod, dateRange, orderId)
- Ensure `getPaymentStats` returns proper statistics format
- Verify payment status updates sync with order payment status
- Ensure refund processing creates Refund record

---

### **9. DASHBOARD ENDPOINT** (`/api/dashboard`)

**Route:**
- `GET /api/dashboard` - Get dashboard summary data

**Controller Function:**
```javascript
// dashboardController.js (or add to analyticsController.js)
- getDashboardStats
  Returns:
  - todayStats: { orders, revenue, customers }
  - monthlyStats: { orders, revenue, customers, growth }
  - recentOrders: [last 10 orders]
  - lowStockAlerts: [inventory items below minStockLevel]
  - pendingTasks: [tasks with status 'pending']
  - pendingComplaints: [complaints with status 'open']
  - revenueChart: [daily revenue for last 7 days]
  - ordersChart: [daily orders for last 7 days]
```

---

### **10. KDS (Kitchen Display System) ENDPOINT** (`/api/kds`)

**Route:**
- `GET /api/kds/orders` - Get orders for KDS display (filter: branchId, status)

**Controller Function:**
```javascript
// kdsController.js (or add to orderController.js)
- getKDSOrders
  Returns orders filtered by:
  - branchId (from authenticated user)
  - status: 'Placed', 'Preparing', 'Baking' (exclude delivered/cancelled)
  - Sorted by: createdAt (oldest first)
  - Include: order items with preparation time estimates
  - Real-time updates via Socket.io (already configured)
```

---

## 🔄 INTEGRATION REQUIREMENTS

### **Order Flow Integration:**
1. When order is created → Auto-create Payment record
2. When order status changes → Emit Socket.io event
3. When order is delivered → Auto-add loyalty points
4. When order is cancelled → Handle refund if payment completed

### **Payment Flow Integration:**
1. When payment is created → Update order paymentStatus
2. When payment status changes → Update order paymentStatus
3. When refund is processed → Update payment status to 'refunded'
4. When payment completed → Trigger loyalty points calculation

### **Inventory Flow Integration:**
1. When order is created → Check inventory availability
2. When order status is 'Preparing' → Deduct inventory
3. When stock movement recorded → Auto-update inventory quantity
4. When inventory low → Create notification/alert

### **Real-time Updates (Socket.io):**
- Order status changes → Broadcast to relevant users
- KDS updates → Broadcast to kitchen displays
- New orders → Notify kitchen staff
- Payment updates → Notify admin panel

---

## 📝 RESPONSE FORMAT STANDARDS

### **Success Response:**
```javascript
{
  success: true,
  data: { ... } // or [ ... ] for arrays
}
```

### **Error Response:**
```javascript
{
  success: false,
  error: "Error message here",
  stack: "..." // only in development
}
```

### **Pagination Response:**
```javascript
{
  success: true,
  data: [ ... ],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Middleware Usage:**
- All routes: `router.use(protect)` - Require authentication
- Admin only: `router.post('/route', admin, controller)` - Require admin role
- Staff/BranchManager: `router.put('/route', staff, controller)` - Require staff or above

### **Role Hierarchy:**
- `Admin` - Full access
- `BranchManager` - Branch-specific access
- `Staff` - Limited access (orders, tasks, attendance)
- `Customer` - Read-only access to own data

---

## ✅ VALIDATION REQUIREMENTS

1. **Input Validation:**
   - Validate required fields
   - Validate data types
   - Validate enum values
   - Validate references (ObjectId exists)
   - Validate date ranges
   - Validate amounts (positive numbers)

2. **Business Logic Validation:**
   - Check permissions before operations
   - Validate state transitions (e.g., can't complete already completed order)
   - Prevent duplicate entries where needed
   - Validate relationships (e.g., order belongs to user)

3. **Error Messages:**
   - Clear, user-friendly error messages
   - Include field names in validation errors
   - Return appropriate HTTP status codes (400, 401, 403, 404, 500)

---

## 🧪 TESTING CONSIDERATIONS

While not required in this implementation, structure code to be testable:
- Pure functions where possible
- Clear separation of concerns
- Proper error handling
- Consistent response formats

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Models**
- [ ] Create all 19 missing models
- [ ] Add proper indexes for performance
- [ ] Add validation and methods
- [ ] Test model relationships

### **Phase 2: Controllers**
- [ ] Create inventoryController.js
- [ ] Create analyticsController.js
- [ ] Create marketingController.js
- [ ] Create operationsController.js
- [ ] Create qualityController.js
- [ ] Create financialController.js
- [ ] Create systemController.js
- [ ] Enhance paymentController.js
- [ ] Create/Enhance dashboardController.js
- [ ] Create/Enhance kdsController.js

### **Phase 3: Routes**
- [ ] Create inventoryRoutes.js
- [ ] Create analyticsRoutes.js
- [ ] Create marketingRoutes.js
- [ ] Create operationsRoutes.js
- [ ] Create qualityRoutes.js
- [ ] Create financialRoutes.js
- [ ] Create systemRoutes.js
- [ ] Update paymentRoutes.js
- [ ] Add dashboard route
- [ ] Add KDS route

### **Phase 4: Server Integration**
- [ ] Register all routes in server.js
- [ ] Test all endpoints
- [ ] Verify authentication works
- [ ] Test error handling
- [ ] Verify Socket.io integration

### **Phase 5: Integration Testing**
- [ ] Test complete order flow
- [ ] Test payment flow
- [ ] Test inventory updates
- [ ] Test real-time updates
- [ ] Test all CRUD operations

---

## 🎯 PRIORITY ORDER

1. **HIGH PRIORITY** (Core functionality):
   - Analytics (Dashboard needs it)
   - Inventory (Inventory page needs it)
   - Payment enhancements (Payments page needs it)

2. **MEDIUM PRIORITY** (Feature pages):
   - Marketing (Campaigns, Loyalty, Notifications)
   - Operations (Shifts, Tasks, Attendance)
   - Quality (Reviews, Complaints)
   - Financial (Expenses, Refunds)

3. **LOW PRIORITY** (Configuration):
   - System (Settings, Categories)
   - KDS (Can use existing order endpoints with filtering)

---

## 📚 CODE EXAMPLES

### **Example Controller Function:**
```javascript
import asyncHandler from '../middleware/asyncHandler.js';
import Inventory from '../models/Inventory.js';
import Menu from '../models/Menu.js';
import Branch from '../models/Branch.js';

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventory = asyncHandler(async (req, res) => {
  const { branchId, lowStock, search, page = 1, limit = 50 } = req.query;
  
  const filter = {};
  if (branchId) filter.branchId = branchId;
  if (lowStock === 'true') {
    filter.$expr = { $lt: ['$quantity', '$minStockLevel'] };
  }
  if (search) {
    filter.$or = [
      { 'itemId.name': { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const inventory = await Inventory.find(filter)
    .populate('itemId', 'name category')
    .populate('branchId', 'branchName')
    .sort({ quantity: 1 }) // Sort by quantity ascending (low stock first)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Inventory.countDocuments(filter);

  res.json({
    success: true,
    data: inventory,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});
```

### **Example Route File:**
```javascript
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats
} from '../controllers/inventoryController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInventory)
  .post(admin, createInventoryItem);

router.get('/stats', getInventoryStats);

router.route('/:id')
  .get(getInventoryItem)
  .put(admin, updateInventoryItem)
  .delete(admin, deleteInventoryItem);

export default router;
```

---

## 🚀 START IMPLEMENTATION

Begin with **HIGH PRIORITY** modules:
1. Analytics Controller & Routes
2. Inventory Controller & Routes  
3. Payment enhancements

Then proceed with **MEDIUM PRIORITY** modules, and finally **LOW PRIORITY**.

**Remember:** Follow existing code patterns, use asyncHandler, implement proper error handling, and ensure all responses match the expected frontend format.

---

## 📞 ENDPOINT SUMMARY

### **Complete API Endpoint List:**

```
Authentication:
POST   /api/auth/login
POST   /api/auth/admin/login
POST   /api/auth/register
GET    /api/auth/me

Users:
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

Branches:
GET    /api/branches
POST   /api/branches
GET    /api/branches/:id
PUT    /api/branches/:id
DELETE /api/branches/:id

Menu:
GET    /api/menu
POST   /api/menu
GET    /api/menu/:id
PUT    /api/menu/:id
DELETE /api/menu/:id

Orders:
GET    /api/admin/orders
POST   /api/admin/orders
GET    /api/admin/orders/:id
PUT    /api/admin/orders/:id
PUT    /api/admin/orders/:id/status
PUT    /api/admin/orders/:id/assign-rider
PUT    /api/admin/orders/:id/cancel

Payments:
GET    /api/payments
GET    /api/payments/stats
GET    /api/payments/:id
POST   /api/payments
PUT    /api/payments/:id
PATCH  /api/payments/:id/status
POST   /api/payments/:id/refund

Riders:
GET    /api/riders
POST   /api/riders
GET    /api/riders/:id
PUT    /api/riders/:id
DELETE /api/riders/:id
GET    /api/riders/available
PUT    /api/riders/:id/availability

Inventory:
GET    /api/inventory
GET    /api/inventory/stats
POST   /api/inventory
GET    /api/inventory/:id
PUT    /api/inventory/:id
DELETE /api/inventory/:id

Ingredients:
GET    /api/ingredients
POST   /api/ingredients
GET    /api/ingredients/:id
PUT    /api/ingredients/:id
DELETE /api/ingredients/:id

Suppliers:
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

Stock Movements:
GET    /api/stock-movements
POST   /api/stock-movements

Analytics:
GET    /api/analytics/sales-reports
GET    /api/analytics/order-metrics
GET    /api/analytics/customer-stats
GET    /api/analytics/dashboard

Marketing - Campaigns:
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/activate
POST   /api/campaigns/:id/pause

Marketing - Loyalty:
GET    /api/loyalty-programs
GET    /api/loyalty-programs/:userId
PUT    /api/loyalty-programs/:userId
POST   /api/loyalty-programs/:userId/points

Marketing - Notifications:
GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/:id
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

Operations - Shifts:
GET    /api/shifts
POST   /api/shifts
GET    /api/shifts/:id
PUT    /api/shifts/:id
DELETE /api/shifts/:id
PUT    /api/shifts/:id/start
PUT    /api/shifts/:id/end

Operations - Tasks:
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PUT    /api/tasks/:id/complete

Operations - Attendance:
GET    /api/attendance
POST   /api/attendance/check-in
POST   /api/attendance/check-out
PUT    /api/attendance/:id

Quality - Reviews:
GET    /api/reviews
POST   /api/reviews
GET    /api/reviews/:id
PUT    /api/reviews/:id/status
POST   /api/reviews/:id/respond
POST   /api/reviews/:id/helpful

Quality - Complaints:
GET    /api/complaints
POST   /api/complaints
GET    /api/complaints/:id
PUT    /api/complaints/:id
PUT    /api/complaints/:id/assign
PUT    /api/complaints/:id/resolve

Financial - Expenses:
GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/:id
PUT    /api/expenses/:id
PUT    /api/expenses/:id/approve
PUT    /api/expenses/:id/reject
DELETE /api/expenses/:id

Financial - Refunds:
GET    /api/refunds
POST   /api/refunds
GET    /api/refunds/:id
PUT    /api/refunds/:id/process
PUT    /api/refunds/:id/complete
PUT    /api/refunds/:id/reject

System - Settings:
GET    /api/settings
GET    /api/settings/:key
POST   /api/settings
PUT    /api/settings/:key
DELETE /api/settings/:key

System - Categories:
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PUT    /api/categories/:id
DELETE /api/categories/:id

KDS:
GET    /api/kds/orders

Dashboard:
GET    /api/dashboard

Health:
GET    /api/health
```

---

**Now implement all missing backend functionality following this comprehensive guide!** 🚀

