export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/admin/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
  USERS: {
    GET_ALL: '/api/users',
    CREATE: '/api/users',
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
  },
  BRANCHES: {
    GET_ALL: '/api/branches',
    CREATE: '/api/branches',
    UPDATE: (id) => `/api/branches/${id}`,
    DELETE: (id) => `/api/branches/${id}`,
  },
  MENU: {
    GET_ALL: '/api/menu',
    CREATE: '/api/menu',
    UPDATE: (id) => `/api/menu/${id}`,
    DELETE: (id) => `/api/menu/${id}`,
  },
  ORDERS: {
    GET_ALL: '/api/admin/orders',
    CREATE: '/api/admin/orders',
    GET_ONE: (id) => `/api/admin/orders/${id}`,
    UPDATE: (id) => `/api/admin/orders/${id}`,
    UPDATE_STATUS: (id) => `/api/admin/orders/${id}/status`, // Fixed path
    ASSIGN_RIDER: (id) => `/api/admin/orders/${id}/assign-rider`, // Fixed path
    CANCEL: (id) => `/api/admin/orders/${id}/cancel`,
    RATE: (id) => `/api/admin/orders/${id}/rate`,
  },
  RIDERS: {
    GET_ALL: '/api/riders',
    GET_AVAILABLE: '/api/riders/available',
    CREATE: '/api/riders',
    UPDATE: (id) => `/api/riders/${id}`,
    UPDATE_AVAILABILITY: (id) => `/api/riders/${id}/availability`,
    DELETE: (id) => `/api/riders/${id}`,
    GET_ORDERS: (id) => `/api/riders/${id}/orders`,
    GET_HISTORY: (id) => `/api/riders/${id}/history`,
    GET_STATS: (id) => `/api/riders/${id}/stats`,
  },
  PAYMENTS: {
    GET_ALL: '/api/payments',
    GET_STATS: '/api/payments/stats',
    CREATE: '/api/payments',
    UPDATE: (id) => `/api/payments/${id}`,
    GET_ONE: (id) => `/api/payments/${id}`,
    UPDATE_STATUS: (id) => `/api/payments/${id}/status`,
    PROCESS_REFUND: (id) => `/api/payments/${id}/refund`,
    CREATE_INTENT: '/api/payments/create-intent',
    CONFIRM: '/api/payments/confirm',
    VERIFY: '/api/payments/verify',
    CASH: '/api/payments/cash',
    COD_COLLECTED: '/api/payments/cod-collected',
    GET_BY_ORDER: (orderId) => `/api/payments/order/${orderId}`,
    MY_PAYMENTS: '/api/payments/my-payments',
    GET_RECEIPT: (id) => `/api/payments/${id}/receipt`,
  },
  // Inventory & Supply Chain
  INVENTORY: {
    GET_ALL: '/api/inventory',
    CREATE: '/api/inventory',
    UPDATE: (id) => `/api/inventory/${id}`,
    DELETE: (id) => `/api/inventory/${id}`,
  },
  INGREDIENTS: {
    GET_ALL: '/api/ingredients',
    CREATE: '/api/ingredients',
    UPDATE: (id) => `/api/ingredients/${id}`,
    DELETE: (id) => `/api/ingredients/${id}`,
  },
  SUPPLIERS: {
    GET_ALL: '/api/suppliers',
    CREATE: '/api/suppliers',
    UPDATE: (id) => `/api/suppliers/${id}`,
    DELETE: (id) => `/api/suppliers/${id}`,
  },
  STOCK_MOVEMENTS: {
    GET_ALL: '/api/stock-movements',
    CREATE: '/api/stock-movements',
  },
  // Analytics & Reporting
  ANALYTICS: {
    SALES_REPORTS: '/api/analytics/sales-reports',
    CUSTOMER_ANALYTICS: (userId) => `/api/analytics/customers/${userId}`,
    ORDER_METRICS: '/api/analytics/order-metrics',
    CUSTOMER_STATS: '/api/analytics/customer-stats',
  },
  // Marketing & Promotions
  MARKETING: {
    CAMPAIGNS: {
      GET_ALL: '/api/campaigns',
      CREATE: '/api/campaigns',
      UPDATE: (id) => `/api/campaigns/${id}`,
      DELETE: (id) => `/api/campaigns/${id}`,
    },
    LOYALTY: {
      GET_ALL: '/api/loyalty-programs',
      GET_ONE: (userId) => `/api/loyalty-programs/${userId}`,
      UPDATE: (userId) => `/api/loyalty-programs/${userId}`,
    },
    NOTIFICATIONS: {
      GET_ALL: '/api/notifications',
      CREATE: '/api/notifications',
      UPDATE: (id) => `/api/notifications/${id}`,
      MARK_READ: (id) => `/api/notifications/${id}/read`,
    },
  },
  // Operations & Staff
  OPERATIONS: {
    SHIFTS: {
      GET_ALL: '/api/shifts',
      CREATE: '/api/shifts',
      UPDATE: (id) => `/api/shifts/${id}`,
      DELETE: (id) => `/api/shifts/${id}`,
    },
    TASKS: {
      GET_ALL: '/api/tasks',
      CREATE: '/api/tasks',
      UPDATE: (id) => `/api/tasks/${id}`,
      DELETE: (id) => `/api/tasks/${id}`,
    },
    ATTENDANCE: {
      GET_ALL: '/api/attendance',
      CREATE: '/api/attendance',
      UPDATE: (id) => `/api/attendance/${id}`,
    },
  },
  // Quality & Reviews
  QUALITY: {
    REVIEWS: {
      GET_ALL: '/api/reviews',
      CREATE: '/api/reviews',
      UPDATE_STATUS: (id) => `/api/reviews/${id}/status`,
      RESPOND: (id) => `/api/reviews/${id}/respond`,
    },
    COMPLAINTS: {
      GET_ALL: '/api/complaints',
      CREATE: '/api/complaints',
      UPDATE: (id) => `/api/complaints/${id}`,
      RESOLVE: (id) => `/api/complaints/${id}/resolve`,
      ASSIGN: (id) => `/api/complaints/${id}/assign`,
    },
  },
  // Financial Management
  FINANCIAL: {
    EXPENSES: {
      GET_ALL: '/api/expenses',
      CREATE: '/api/expenses',
      UPDATE: (id) => `/api/expenses/${id}`,
      APPROVE: (id) => `/api/expenses/${id}/approve`,
      REJECT: (id) => `/api/expenses/${id}/reject`,
    },
    REFUNDS: {
      GET_ALL: '/api/refunds',
      CREATE: '/api/refunds',
      PROCESS: (id) => `/api/refunds/${id}/process`,
      COMPLETE: (id) => `/api/refunds/${id}/complete`,
    },
  },
  // System & Configuration
  SYSTEM: {
    SETTINGS: {
      GET_ALL: '/api/settings',
      GET_ONE: (key) => `/api/settings/${key}`,
      UPDATE: (key) => `/api/settings/${key}`,
      CREATE: '/api/settings',
    },
    CATEGORIES: {
      GET_ALL: '/api/categories',
      CREATE: '/api/categories',
      UPDATE: (id) => `/api/categories/${id}`,
      DELETE: (id) => `/api/categories/${id}`,
    },
  },
};
