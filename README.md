# 🍕 Pizza Management System

A comprehensive full-stack pizza restaurant management system built with the MERN stack (MongoDB, Express.js, React, Node.js). This system provides end-to-end restaurant operations management including order processing, inventory tracking, delivery management, analytics, and more.


## ✨ Features

### 🛒 Order Management
- Real-time order tracking with Socket.io
- Multiple order types: Delivery, Takeaway, Dine-In
- Order status updates with live notifications
- Kitchen Display System (KDS) for order preparation

### 📊 Dashboard & Analytics
- Comprehensive sales analytics and reporting
- Customer behavior analytics
- Revenue tracking and financial reports
- Order metrics and performance insights

### 🍕 Menu Management
- Dynamic menu with categories
- Customizable menu items with add-ons
- Price management and sizing options
- Menu item availability toggle

### 📦 Inventory Management
- Real-time stock tracking
- Ingredient management
- Stock movement history
- Low stock alerts and notifications
- Supplier management

### 🏪 Branch Management
- Multi-branch support
- Branch-specific inventory
- Staff assignment per branch
- Branch performance analytics

### 🛵 Delivery Management
- Rider assignment and tracking
- Live location updates
- Delivery status management
- Rider performance metrics

### 💳 Payment Integration
- Stripe payment gateway integration
- Multiple payment methods
- Refund management
- Payment history and reports

### 👥 User Management
- Role-based access control (Admin, Branch Manager, Staff, Customer)
- User authentication with JWT
- Profile management
- Staff attendance tracking

### 📣 Marketing & Loyalty
- Campaign management
- Loyalty program integration
- Promotional offers
- Customer engagement tools

### ⚙️ Quality & Operations
- Quality control management
- Task assignment and tracking
- Shift management
- Complaint handling system

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **Payment:** Stripe
- **Email:** Nodemailer
- **Validation:** Express Validator

### Frontend
- **Framework:** React 18
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

## 📁 Project Structure

```
pizza-management-system/
├── backend/
│   ├── config/
│   │   ├── db.js              # Database configuration
│   │   └── stripe.js          # Stripe configuration
│   ├── controllers/           # Route controllers
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── branchController.js
│   │   ├── cartController.js
│   │   ├── inventoryController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── riderController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT authentication
│   │   ├── errorHandler.js    # Global error handling
│   │   └── roleMiddleware.js  # Role-based access
│   ├── models/                # Mongoose models
│   │   ├── Branch.js
│   │   ├── Cart.js
│   │   ├── Inventory.js
│   │   ├── Menu.js
│   │   ├── Order.js
│   │   ├── User.js
│   │   └── ...
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions
│   └── server.js              # Entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/               # API service functions
│   │   ├── assets/            # Static assets
│   │   ├── components/        # Reusable components
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   └── Layout/
│   │   ├── pages/             # Page components
│   │   │   ├── Analytics.jsx
│   │   │   ├── Branches.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── ...
│   │   ├── store/             # Redux store
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.mjs
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Stripe account (for payments)

### Clone the Repository
```bash
git clone https://github.com/yourusername/pizza-management-system.git
cd pizza-management-system
```

### Install Backend Dependencies
```bash
cd backend
npm install
```

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/pizza-management
# or MongoDB Atlas
# MONGODB_URI=mongodb+srv://<your-username>:<your-password>@<your-cluster>.mongodb.net/pizza-management

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5174

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## ▶️ Running the Application

### Development Mode

**Start Backend Server:**
```bash
cd backend
npm run dev
```
The backend server will run on `http://localhost:5001`

**Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5174`

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend:**
```bash
cd backend
npm start
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/profile` | Get user profile |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| POST | `/api/menu` | Create menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get order by ID |
| PUT | `/api/orders/:id/status` | Update order status |

### Branches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches` | Get all branches |
| POST | `/api/branches` | Create branch |
| PUT | `/api/branches/:id` | Update branch |
| DELETE | `/api/branches/:id` | Delete branch |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get inventory items |
| POST | `/api/inventory` | Add inventory item |
| PUT | `/api/inventory/:id` | Update inventory |
| GET | `/api/stock-movements` | Get stock movements |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/sales` | Get sales analytics |
| GET | `/api/analytics/customers` | Get customer analytics |
| GET | `/api/analytics/orders` | Get order metrics |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create payment intent |
| POST | `/api/payments/webhook` | Stripe webhook |
| GET | `/api/payments` | Get payment history |

## 🖼 Screenshots

*Add screenshots of your application here*

- Dashboard
- Order Management
- Menu Management
- Inventory
- Analytics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Your Name - [GitHub Profile](https://github.com/yourusername)

---

⭐ Star this repository if you find it helpful!
