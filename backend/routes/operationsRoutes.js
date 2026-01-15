import express from 'express';
import { protect, admin, staff } from '../middleware/authMiddleware.js';
import {
  getShifts,
  getShift,
  createShift,
  updateShift,
  deleteShift,
  startShift,
  endShift,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getAttendance,
  checkIn,
  checkOut,
  updateAttendance,
} from '../controllers/operationsController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Shift routes
router.route('/shifts')
  .get(getShifts)
  .post(admin, createShift);

router.route('/shifts/:id')
  .get(getShift)
  .put(admin, updateShift)
  .delete(admin, deleteShift);

router.put('/shifts/:id/start', startShift);
router.put('/shifts/:id/end', endShift);

// Task routes
router.route('/tasks')
  .get(getTasks)
  .post(staff, createTask);

router.route('/tasks/:id')
  .get(getTask)
  .put(staff, updateTask)
  .delete(admin, deleteTask);

router.put('/tasks/:id/complete', completeTask);

// Attendance routes
router.get('/attendance', getAttendance);
router.post('/attendance/check-in', checkIn);
router.post('/attendance/check-out', checkOut);
router.put('/attendance/:id', admin, updateAttendance);

export default router;
