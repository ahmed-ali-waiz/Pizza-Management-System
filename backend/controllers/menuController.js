import Menu from '../models/Menu.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getMenuItems = asyncHandler(async (req, res) => {
  const menuItems = await Menu.find();
  res.json({ success: true, data: menuItems });
});

export const getMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  res.json({ success: true, data: menuItem });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await Menu.create(req.body);
  res.status(201).json({ success: true, data: menuItem });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await Menu.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  res.json({ success: true, data: menuItem });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }

  await menuItem.deleteOne();
  res.json({ success: true, data: {} });
});















