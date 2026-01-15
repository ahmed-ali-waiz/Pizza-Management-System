import Branch from '../models/Branch.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().populate('manager');
  res.json({ success: true, data: branches });
});

export const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id).populate('manager');

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  res.json({ success: true, data: branch });
});

export const createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  const populatedBranch = await Branch.findById(branch._id).populate('manager');
  res.status(201).json({ success: true, data: populatedBranch });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('manager');

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  res.json({ success: true, data: branch });
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    res.status(404);
    throw new Error('Branch not found');
  }

  await branch.deleteOne();
  res.json({ success: true, data: {} });
});















