const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_REGEX.test(email);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication endpoints
 */

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/register
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account with a bcrypt-hashed password. Emails are stored as lowercase.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: securePass123
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful.
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'All fields (name, email, password) are required.' });
    }
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Name must be a non-empty string.' });
    }
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // ── Create user ───────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12); // cost 12 for production
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    await newUser.save();

    return res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/login
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     description: Authenticates a user and returns a signed JWT (valid 1 day).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securePass123
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token and basic user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Missing fields or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials format.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── User lookup ───────────────────────────────────────────────────────────
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Password check ────────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/profile
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [Auth]
 *     description: Returns the profile of the currently authenticated user. Requires a valid JWT Bearer token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized — token missing or expired
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error('Profile error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;