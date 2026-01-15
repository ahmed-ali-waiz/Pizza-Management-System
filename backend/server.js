import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import User from './models/User.js';
import Order from './models/Order.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import adminOrderRoutes from './routes/orderRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import stockMovementRoutes from './routes/stockMovementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import qualityRoutes from './routes/qualityRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ============================================
// Socket.io Setup
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Global variable to track connected users
const connectedUsers = new Map();

// Socket.io Connection Handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins their personal tracking room
  socket.on('join_order_tracking', (userId) => {
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined order tracking room`);
  });

  // Admin/Rider updates order status (triggered from admin panel or rider app)
  socket.on('update_order_status', async (data) => {
    try {
      const { orderId, userId, newStatus, estimatedDelivery } = data;

      // Update order in database
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          orderStatus: newStatus,
          ...(estimatedDelivery && { estimatedDeliveryTime: estimatedDelivery }),
        },
        { new: true }
      ).populate('riderAssigned');

      // Notify user about status change
      io.to(`user_${userId}`).emit('order_status_updated', {
        orderId,
        status: newStatus,
        estimatedDelivery,
        updatedAt: new Date(),
      });

      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  // Rider sends live location updates
  socket.on('update_rider_location', (data) => {
    try {
      const { orderId, userId, latitude, longitude, distance, eta } = data;

      // Broadcast rider location to the user
      io.to(`user_${userId}`).emit('rider_location_updated', {
        orderId,
        riderLocation: { latitude, longitude },
        distance, // Distance in km
        eta, // Estimated time in minutes
        updatedAt: new Date(),
      });

      console.log(`Rider location updated for order ${orderId}`);
    } catch (error) {
      console.error('Error updating rider location:', error);
    }
  });

  // User accepts new order (for notifications)
  socket.on('order_created', (data) => {
    try {
      const { userId, orderId } = data;
      io.to(`user_${userId}`).emit('new_order_received', {
        orderId,
        message: 'Your order has been placed successfully!',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error in order_created event:', error);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    // Remove user from connected list
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log(`Socket ${socket.id} disconnected`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// ============================================
// Middleware
// ============================================
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Admin Panel
      'http://localhost:5174', // User Portal
      process.env.FRONTEND_URL || 'http://localhost:5174',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// Database Connection
// ============================================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pizza-management');
    console.log('✅ MongoDB Connected: ' + (process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-management'));
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// ============================================
// Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', marketingRoutes); // Handles /api/campaigns, /api/loyalty-programs, /api/notifications
app.use('/api', operationsRoutes); // Handles /api/shifts, /api/tasks, /api/attendance
app.use('/api', qualityRoutes); // Handles /api/reviews, /api/complaints
app.use('/api', financialRoutes); // Handles /api/expenses, /api/refunds
app.use('/api', systemRoutes); // Handles /api/settings, /api/categories
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🍕 Pizza Management System API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      cart: '/api/cart',
      orders: '/api/orders',
      users: '/api/users',
      menu: '/api/menu',
      branches: '/api/branches',
      riders: '/api/riders',
      payments: '/api/payments',
      inventory: '/api/inventory',
      stockMovements: '/api/stock-movements',
      analytics: '/api/analytics',
      campaigns: '/api/campaigns',
      loyaltyPrograms: '/api/loyalty-programs',
      notifications: '/api/notifications',
      shifts: '/api/shifts',
      tasks: '/api/tasks',
      attendance: '/api/attendance',
      reviews: '/api/reviews',
      complaints: '/api/complaints',
      expenses: '/api/expenses',
      refunds: '/api/refunds',
      settings: '/api/settings',
      categories: '/api/categories',
      dashboard: '/api/dashboard',
      health: '/api/health',
    },
    documentation: '/README-USER-PORTAL.md',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ============================================
// Error Handling Middleware
// ============================================
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================
// Use API_PORT env var if provided, otherwise fall back to 5001.
// We intentionally ignore any global PORT to avoid conflicts with other tools.
const PORT = Number(process.env.API_PORT) || 5001;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║    🍕 Pizza Management System API Server                ║
║                                                          ║
║    Server: http://localhost:${PORT}                        ║
║    Socket.io: ws://localhost:${PORT}                       ║
║    Environment: ${process.env.NODE_ENV || 'development'}                ║
║                                                          ║
║    Admin Panel: http://localhost:5173                    ║
║    User Portal: http://localhost:5174                    ║
║                                                          ║
║    Ready to serve delicious pizzas! 🚀                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  httpServer.close(() => {
    mongoose.connection.close().then(() => {
      console.log('✅ Server shut down');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing database:', err);
      process.exit(1);
    });
  });
});

startServer();

export { io };
