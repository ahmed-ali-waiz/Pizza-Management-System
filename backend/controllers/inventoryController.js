import asyncHandler from '../middleware/asyncHandler.js';
import Inventory from '../models/Inventory.js';
import StockMovement from '../models/StockMovement.js';
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

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let inventory = await Inventory.find(filter)
    .populate('itemId', 'name category price imageUrl')
    .populate('branchId', 'branchName address')
    .sort({ quantity: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Search filter after population
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    inventory = inventory.filter(
      (item) =>
        item.itemId?.name?.match(searchRegex) ||
        item.location?.match(searchRegex)
    );
  }

  const total = await Inventory.countDocuments(filter);

  res.json({
    success: true,
    data: inventory,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
export const getInventoryItem = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id)
    .populate('itemId', 'name category price imageUrl')
    .populate('branchId', 'branchName address');

  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  res.json({ success: true, data: inventory });
});

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private/Admin
export const createInventoryItem = asyncHandler(async (req, res) => {
  const { itemId, branchId, quantity, minStockLevel, maxStockLevel, unit, costPerUnit, supplier, location } = req.body;

  // Check if menu item exists
  const menuItem = await Menu.findById(itemId);
  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  // Check if branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  // Check for duplicate
  const existingInventory = await Inventory.findOne({ itemId, branchId });
  if (existingInventory) {
    res.status(400);
    throw new Error('Inventory item already exists for this branch');
  }

  const inventory = await Inventory.create({
    itemId,
    branchId,
    quantity,
    minStockLevel,
    maxStockLevel,
    unit,
    costPerUnit,
    supplier,
    location,
    lastRestocked: quantity > 0 ? new Date() : null,
  });

  // Create initial stock movement if quantity > 0
  if (quantity > 0) {
    await StockMovement.create({
      inventoryId: inventory._id,
      branchId,
      movementType: 'purchase',
      quantity,
      previousQuantity: 0,
      newQuantity: quantity,
      performedBy: req.user._id,
      notes: 'Initial stock entry',
    });
  }

  const populatedInventory = await Inventory.findById(inventory._id)
    .populate('itemId', 'name category price')
    .populate('branchId', 'branchName');

  res.status(201).json({ success: true, data: populatedInventory });
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventoryItem = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  const previousQuantity = inventory.quantity;
  const { quantity, ...otherFields } = req.body;

  // If quantity is being updated, create stock movement
  if (quantity !== undefined && quantity !== previousQuantity) {
    const movementType = quantity > previousQuantity ? 'purchase' : 'adjustment';
    await StockMovement.create({
      inventoryId: inventory._id,
      branchId: inventory.branchId,
      movementType,
      quantity: quantity - previousQuantity,
      previousQuantity,
      newQuantity: quantity,
      performedBy: req.user._id,
      notes: `Stock ${movementType === 'purchase' ? 'added' : 'adjusted'}`,
    });

    if (quantity > previousQuantity) {
      otherFields.lastRestocked = new Date();
    }
  }

  const updatedInventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    { quantity, ...otherFields },
    { new: true, runValidators: true }
  )
    .populate('itemId', 'name category price')
    .populate('branchId', 'branchName');

  res.json({ success: true, data: updatedInventory });
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  await inventory.deleteOne();

  res.json({ success: true, message: 'Inventory item deleted' });
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
export const getInventoryStats = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const filter = branchId ? { branchId } : {};

  const stats = await Inventory.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$costPerUnit'] } },
        lowStockCount: {
          $sum: {
            $cond: [{ $lt: ['$quantity', '$minStockLevel'] }, 1, 0],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: ['$quantity', 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  const lowStockItems = await Inventory.find({
    ...filter,
    $expr: { $lt: ['$quantity', '$minStockLevel'] },
  })
    .populate('itemId', 'name category')
    .populate('branchId', 'branchName')
    .limit(10);

  res.json({
    success: true,
    data: {
      summary: stats[0] || {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      },
      lowStockItems,
    },
  });
});

// @desc    Get stock movements
// @route   GET /api/stock-movements
// @access  Private
export const getStockMovements = asyncHandler(async (req, res) => {
  const { inventoryId, branchId, movementType, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (inventoryId) filter.inventoryId = inventoryId;
  if (branchId) filter.branchId = branchId;
  if (movementType) filter.movementType = movementType;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const movements = await StockMovement.find(filter)
    .populate({
      path: 'inventoryId',
      populate: { path: 'itemId', select: 'name' },
    })
    .populate('branchId', 'branchName')
    .populate('performedBy', 'name email')
    .populate('referenceOrder', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await StockMovement.countDocuments(filter);

  res.json({
    success: true,
    data: movements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Create stock movement
// @route   POST /api/stock-movements
// @access  Private
export const createStockMovement = asyncHandler(async (req, res) => {
  const { inventoryId, movementType, quantity, notes, referenceOrder } = req.body;

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  const previousQuantity = inventory.quantity;
  let newQuantity = previousQuantity;

  // Calculate new quantity based on movement type
  switch (movementType) {
    case 'purchase':
    case 'return':
      newQuantity += Math.abs(quantity);
      break;
    case 'sale':
    case 'waste':
    case 'transfer':
      newQuantity -= Math.abs(quantity);
      break;
    case 'adjustment':
      newQuantity = quantity; // Direct set for adjustments
      break;
    default:
      res.status(400);
      throw new Error('Invalid movement type');
  }

  if (newQuantity < 0) {
    res.status(400);
    throw new Error('Insufficient stock for this movement');
  }

  // Create movement record
  const movement = await StockMovement.create({
    inventoryId,
    branchId: inventory.branchId,
    movementType,
    quantity: movementType === 'adjustment' ? quantity - previousQuantity : quantity,
    previousQuantity,
    newQuantity,
    performedBy: req.user._id,
    notes,
    referenceOrder,
  });

  // Update inventory quantity
  inventory.quantity = newQuantity;
  if (movementType === 'purchase') {
    inventory.lastRestocked = new Date();
  }
  await inventory.save();

  const populatedMovement = await StockMovement.findById(movement._id)
    .populate({
      path: 'inventoryId',
      populate: { path: 'itemId', select: 'name' },
    })
    .populate('branchId', 'branchName')
    .populate('performedBy', 'name email');

  res.status(201).json({ success: true, data: populatedMovement });
});
