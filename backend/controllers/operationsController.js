import asyncHandler from '../middleware/asyncHandler.js';
import Shift from '../models/Shift.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

// =============================================
// SHIFT CONTROLLERS
// =============================================

// @desc    Get all shifts
// @route   GET /api/shifts
// @access  Private
export const getShifts = asyncHandler(async (req, res) => {
  const { userId, branchId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.shiftDate = {};
    if (startDate) filter.shiftDate.$gte = new Date(startDate);
    if (endDate) filter.shiftDate.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const shifts = await Shift.find(filter)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName')
    .sort({ shiftDate: -1, startTime: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Shift.countDocuments(filter);

  res.json({
    success: true,
    data: shifts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single shift
// @route   GET /api/shifts/:id
// @access  Private
export const getShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id)
    .populate('userId', 'name email role phone')
    .populate('branchId', 'branchName address');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  res.json({ success: true, data: shift });
});

// @desc    Create shift
// @route   POST /api/shifts
// @access  Private/Admin
export const createShift = asyncHandler(async (req, res) => {
  const { userId, branchId, shiftDate, startTime, endTime } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Validate branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // Check for conflicting shifts
  const conflictingShift = await Shift.findOne({
    userId,
    shiftDate: new Date(shiftDate),
    status: { $nin: ['cancelled'] },
    $or: [
      { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
    ],
  });

  if (conflictingShift) {
    res.status(400);
    throw new Error('User already has a shift scheduled during this time');
  }

  const shift = await Shift.create(req.body);

  const populatedShift = await Shift.findById(shift._id)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName');

  res.status(201).json({ success: true, data: populatedShift });
});

// @desc    Update shift
// @route   PUT /api/shifts/:id
// @access  Private/Admin
export const updateShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName');

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  res.json({ success: true, data: shift });
});

// @desc    Delete shift
// @route   DELETE /api/shifts/:id
// @access  Private/Admin
export const deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  await shift.deleteOne();

  res.json({ success: true, message: 'Shift deleted' });
});

// @desc    Start shift
// @route   PUT /api/shifts/:id/start
// @access  Private
export const startShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  if (shift.status !== 'scheduled') {
    res.status(400);
    throw new Error('Shift cannot be started');
  }

  shift.status = 'in-progress';
  shift.actualStartTime = new Date();
  await shift.save();

  const populatedShift = await Shift.findById(shift._id)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName');

  res.json({ success: true, data: populatedShift });
});

// @desc    End shift
// @route   PUT /api/shifts/:id/end
// @access  Private
export const endShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findById(req.params.id);

  if (!shift) {
    res.status(404);
    throw new Error('Shift not found');
  }

  if (shift.status !== 'in-progress') {
    res.status(400);
    throw new Error('Shift is not in progress');
  }

  shift.status = 'completed';
  shift.actualEndTime = new Date();
  await shift.save();

  const populatedShift = await Shift.findById(shift._id)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName');

  res.json({ success: true, data: populatedShift });
});

// =============================================
// TASK CONTROLLERS
// =============================================

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  const { assignedTo, branchId, status, priority, category, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (assignedTo) filter.assignedTo = assignedTo;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email')
    .populate('branchId', 'branchName')
    .populate('orderId', 'orderNumber')
    .sort({ priority: -1, dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email role phone')
    .populate('assignedBy', 'name email')
    .populate('branchId', 'branchName address')
    .populate('orderId', 'orderNumber totalAmount');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: task });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const taskData = {
    ...req.body,
    assignedBy: req.user._id,
  };

  // Validate assignedTo user exists
  const user = await User.findById(taskData.assignedTo);
  if (!user) {
    res.status(404);
    throw new Error('Assigned user not found');
  }

  // Validate branch exists
  const branch = await Branch.findById(taskData.branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  const task = await Task.create(taskData);

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email')
    .populate('branchId', 'branchName');

  res.status(201).json({ success: true, data: populatedTask });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email')
    .populate('branchId', 'branchName');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({ success: true, data: task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await task.deleteOne();

  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Complete task
// @route   PUT /api/tasks/:id/complete
// @access  Private
export const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = 'completed';
  task.completedAt = new Date();
  if (req.body.actualTime) {
    task.actualTime = req.body.actualTime;
  }
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('branchId', 'branchName');

  res.json({ success: true, data: populatedTask });
});

// =============================================
// ATTENDANCE CONTROLLERS
// =============================================

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = asyncHandler(async (req, res) => {
  const { userId, branchId, status, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (userId) filter.userId = userId;
  if (branchId) filter.branchId = branchId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const attendance = await Attendance.find(filter)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName')
    .populate('shiftId', 'startTime endTime shiftType')
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(filter);

  res.json({
    success: true,
    data: attendance,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Check in
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = asyncHandler(async (req, res) => {
  const { userId, branchId, shiftId, notes } = req.body;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    userId: userId || req.user._id,
    date: today,
  });

  if (existingAttendance) {
    res.status(400);
    throw new Error('Already checked in today');
  }

  // Calculate late minutes if shift exists
  let lateMinutes = 0;
  let shift = null;
  if (shiftId) {
    shift = await Shift.findById(shiftId);
    if (shift && now > shift.startTime) {
      lateMinutes = Math.round((now - shift.startTime) / (1000 * 60));
    }
  }

  const attendance = await Attendance.create({
    userId: userId || req.user._id,
    branchId,
    shiftId,
    date: today,
    checkInTime: now,
    status: lateMinutes > 15 ? 'late' : 'present',
    lateMinutes,
    notes,
  });

  // Update shift status if linked
  if (shift) {
    shift.status = 'in-progress';
    shift.actualStartTime = now;
    await shift.save();
  }

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName')
    .populate('shiftId', 'startTime endTime');

  res.status(201).json({ success: true, data: populatedAttendance });
});

// @desc    Check out
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = asyncHandler(async (req, res) => {
  const { userId, notes } = req.body;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const attendance = await Attendance.findOne({
    userId: userId || req.user._id,
    date: today,
  });

  if (!attendance) {
    res.status(404);
    throw new Error('No check-in record found for today');
  }

  if (attendance.checkOutTime) {
    res.status(400);
    throw new Error('Already checked out today');
  }

  attendance.checkOutTime = now;
  attendance.calculateHoursWorked();

  // Calculate overtime if shift exists
  if (attendance.shiftId) {
    const shift = await Shift.findById(attendance.shiftId);
    if (shift && now > shift.endTime) {
      attendance.overtimeHours = Math.round((now - shift.endTime) / (1000 * 60 * 60) * 100) / 100;
    }

    // Update shift status
    shift.status = 'completed';
    shift.actualEndTime = now;
    await shift.save();
  }

  if (notes) attendance.notes = notes;
  await attendance.save();

  const populatedAttendance = await Attendance.findById(attendance._id)
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName')
    .populate('shiftId', 'startTime endTime');

  res.json({ success: true, data: populatedAttendance });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin
export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('userId', 'name email role')
    .populate('branchId', 'branchName')
    .populate('shiftId', 'startTime endTime');

  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  res.json({ success: true, data: attendance });
});
