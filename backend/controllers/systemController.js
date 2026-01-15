import asyncHandler from '../middleware/asyncHandler.js';
import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import Menu from '../models/Menu.js';
import Branch from '../models/Branch.js';

// =============================================
// SETTINGS CONTROLLERS
// =============================================

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
export const getSettings = asyncHandler(async (req, res) => {
  const { category, branchId, isActive } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Get global settings (branchId is null)
  const globalSettings = await Settings.find({ ...filter, branchId: null })
    .populate('updatedBy', 'name')
    .sort({ category: 1, key: 1 });

  // Get branch-specific settings if branchId provided
  let branchSettings = [];
  if (branchId) {
    branchSettings = await Settings.find({ ...filter, branchId })
      .populate('branchId', 'branchName')
      .populate('updatedBy', 'name')
      .sort({ category: 1, key: 1 });
  }

  // Merge settings (branch-specific overrides global)
  const mergedSettings = [...globalSettings];
  branchSettings.forEach((branchSetting) => {
    const globalIndex = mergedSettings.findIndex(
      (g) => g.key === branchSetting.key
    );
    if (globalIndex >= 0) {
      mergedSettings[globalIndex] = branchSetting;
    } else {
      mergedSettings.push(branchSetting);
    }
  });

  res.json({
    success: true,
    data: mergedSettings,
    global: globalSettings,
    branch: branchSettings,
  });
});

// @desc    Get setting by key
// @route   GET /api/settings/:key
// @access  Private
export const getSetting = asyncHandler(async (req, res) => {
  const { branchId } = req.query;

  // Try to find branch-specific setting first
  let setting = null;
  if (branchId) {
    setting = await Settings.findOne({
      key: req.params.key,
      branchId,
    })
      .populate('branchId', 'branchName')
      .populate('updatedBy', 'name');
  }

  // Fall back to global setting
  if (!setting) {
    setting = await Settings.findOne({
      key: req.params.key,
      branchId: null,
    }).populate('updatedBy', 'name');
  }

  if (!setting) {
    res.status(404);
    throw new Error('Setting not found');
  }

  res.json({ success: true, data: setting });
});

// @desc    Create setting
// @route   POST /api/settings
// @access  Private/Admin
export const createSetting = asyncHandler(async (req, res) => {
  const { key, value, type, category, branchId, description } = req.body;

  // Check for existing setting with same key and branchId
  const existing = await Settings.findOne({ key, branchId: branchId || null });
  if (existing) {
    res.status(400);
    throw new Error('Setting with this key already exists');
  }

  // Validate branchId if provided
  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error('Branch not found');
    }
  }

  const setting = await Settings.create({
    key,
    value,
    type,
    category,
    branchId: branchId || null,
    description,
    updatedBy: req.user._id,
  });

  const populatedSetting = await Settings.findById(setting._id)
    .populate('branchId', 'branchName')
    .populate('updatedBy', 'name');

  res.status(201).json({ success: true, data: populatedSetting });
});

// @desc    Update setting
// @route   PUT /api/settings/:key
// @access  Private/Admin
export const updateSetting = asyncHandler(async (req, res) => {
  const { branchId, value, isActive } = req.body;

  const setting = await Settings.findOne({
    key: req.params.key,
    branchId: branchId || null,
  });

  if (!setting) {
    res.status(404);
    throw new Error('Setting not found');
  }

  if (!setting.isEditable && value !== undefined) {
    res.status(400);
    throw new Error('This setting cannot be edited');
  }

  // Validate value type
  if (value !== undefined) {
    setting.value = value;
  }
  if (isActive !== undefined) {
    setting.isActive = isActive;
  }
  setting.updatedBy = req.user._id;

  await setting.save();

  const populatedSetting = await Settings.findById(setting._id)
    .populate('branchId', 'branchName')
    .populate('updatedBy', 'name');

  res.json({ success: true, data: populatedSetting });
});

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private/Admin
export const deleteSetting = asyncHandler(async (req, res) => {
  const { branchId } = req.query;

  const setting = await Settings.findOne({
    key: req.params.key,
    branchId: branchId || null,
  });

  if (!setting) {
    res.status(404);
    throw new Error('Setting not found');
  }

  await setting.deleteOne();

  res.json({ success: true, message: 'Setting deleted' });
});

// =============================================
// CATEGORY CONTROLLERS
// =============================================

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const { branchId, isActive, parentCategory } = req.query;

  const filter = {};
  if (branchId) {
    filter.$or = [{ branchId }, { branchId: null }];
  }
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (parentCategory === 'null') {
    filter.parentCategory = null;
  } else if (parentCategory) {
    filter.parentCategory = parentCategory;
  }

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name')
    .populate('branchId', 'branchName')
    .sort({ displayOrder: 1, name: 1 });

  // Build hierarchical structure
  const rootCategories = categories.filter((c) => !c.parentCategory);
  const buildTree = (parent) => {
    const children = categories.filter(
      (c) => c.parentCategory && c.parentCategory._id?.toString() === parent._id.toString()
    );
    return {
      ...parent.toObject(),
      children: children.map(buildTree),
    };
  };

  const hierarchicalCategories = rootCategories.map(buildTree);

  res.json({
    success: true,
    data: categories,
    hierarchical: hierarchicalCategories,
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name slug')
    .populate('branchId', 'branchName');

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Get subcategories
  const subcategories = await Category.find({ parentCategory: category._id })
    .sort({ displayOrder: 1 });

  // Get menu items count
  const itemCount = await Menu.countDocuments({ category: category.name });

  res.json({
    success: true,
    data: {
      ...category.toObject(),
      subcategories,
      itemCount,
    },
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, branchId, parentCategory } = req.body;

  // Check for duplicate name
  const existing = await Category.findOne({
    name,
    branchId: branchId || null,
  });

  if (existing) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  // Validate parent category if provided
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      res.status(404);
      throw new Error('Parent category not found');
    }
  }

  // Validate branch if provided
  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error('Branch not found');
    }
  }

  const category = await Category.create({
    ...req.body,
    branchId: branchId || null,
  });

  const populatedCategory = await Category.findById(category._id)
    .populate('parentCategory', 'name')
    .populate('branchId', 'branchName');

  res.status(201).json({ success: true, data: populatedCategory });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const { parentCategory } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Prevent circular reference
  if (parentCategory && parentCategory === req.params.id) {
    res.status(400);
    throw new Error('Category cannot be its own parent');
  }

  // Check if setting parent to one of its children
  if (parentCategory) {
    const isDescendant = async (parentId, childId) => {
      const children = await Category.find({ parentCategory: childId });
      for (const child of children) {
        if (child._id.toString() === parentId) return true;
        if (await isDescendant(parentId, child._id)) return true;
      }
      return false;
    };

    if (await isDescendant(parentCategory, req.params.id)) {
      res.status(400);
      throw new Error('Cannot set a descendant as parent category');
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('parentCategory', 'name')
    .populate('branchId', 'branchName');

  res.json({ success: true, data: updatedCategory });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if category has menu items
  const menuItems = await Menu.countDocuments({ category: category.name });
  if (menuItems > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${menuItems} menu items. Reassign items first.`);
  }

  // Check if category has subcategories
  const subcategories = await Category.countDocuments({ parentCategory: category._id });
  if (subcategories > 0) {
    res.status(400);
    throw new Error(`Cannot delete category with ${subcategories} subcategories. Delete subcategories first.`);
  }

  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted' });
});
