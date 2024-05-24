const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const auth = require('./Auth');
const router = express.Router();
const upload = require('./image')
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');



const JWT_SECRET = process.env.JWT_SECRET;
const ObjectId = mongoose.Types.ObjectId;



// User registration
router.post('/register', upload.single('photo'), async (req, res) => {
    try {
      const { username, email, password, name, bio, phone } = req.body;
      
      let photo;
      if (req.file) {
        photo = req.file.filename; 
      } else if (req.body.photo) {
        photo = req.body.photo; 
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).send({ message: 'Email already exists' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({ username, email, password: hashedPassword, name, bio, phone, photo });
      await newUser.save();
  
      res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).send({ message: 'Server error' });
    }
  });
  
// User login
router.post('/login', async (req, res) => {
    console.log(req.body)
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).send({ message: 'Invalid email or password' });

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) return res.status(400).send({ message: 'Invalid email or password' });

  const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.send({ token });
});

// View own profile
router.get('/me', auth.verifyToken, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
});

// Edit profile
router.put('/me', auth.verifyToken, async (req, res) => {
  const updates = req.body;
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.send(user);
});

// Set profile visibility
router.patch('/me/visibility', auth.verifyToken, async (req, res) => {
  const { profileVisibility } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { profileVisibility }, { new: true }).select('-password');
  res.send(user);
});

// List public profiles
router.get('/profiles', async (req, res) => {
  const users = await User.find({ profileVisibility: 'public' }).select('-password');
  res.send(users);
});

// View specific user profile
router.get('/profiles/:id', auth.verifyToken, async (req, res) => {
    console.log(req.params.id)
    const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).send({ message: 'User not found' });

  if (user.profileVisibility === 'private' && req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Access Denied' });
  }

  res.send(user);
});

// Admin access to all profiles
router.get('/admin/profiles', [auth.verifyToken, auth.isAdmin], async (req, res) => {
  const users = await User.find().select('-password');
  res.send(users);
});

module.exports = router;
