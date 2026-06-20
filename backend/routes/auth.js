const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
 //post api
router.post('/register', async (req, res) => {  
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const  newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registration successfull' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST/api/login

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1.User check
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email or password wrong' });
    }

    // 2.Password compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email or password wrong' });
    }

    // 3.JWT Token 
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }                      
    );

    // 4. Token,userinfo
    res.status(200).json({
      message: 'Login successfull',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//GET/api/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;