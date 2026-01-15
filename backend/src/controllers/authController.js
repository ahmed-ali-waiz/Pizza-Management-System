import User from '../../models/User.js';
import Admin from '../models/Admin.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Create user
    const user = new User({ name, email, password, phone });
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, 'user');
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: expiryDate });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is admin trying to login (should use admin panel)
    if (user.role === 'Admin') {
      return res.status(403).json({ error: 'Admins must login from the admin panel' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: expiryDate });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'Admin') {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const accessToken = generateAccessToken(user._id, 'admin');
    const refreshToken = generateRefreshToken(user._id);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: expiryDate });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('addresses');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
