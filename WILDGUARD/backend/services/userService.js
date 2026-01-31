const User = require('../models/User');
const bcrypt = require('bcrypt');

// In-memory storage as fallback
let users = [];
let nextId = 1;

const userService = {
  async createUser(userData) {
    try {
      // Hash the password before creating user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Try MongoDB first
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      return await user.save();
    } catch (error) {
      console.log('Using in-memory storage for user creation');
      // Fallback to in-memory storage - hash password for in-memory storage too
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Fallback to in-memory storage
      const user = {
        _id: nextId.toString(),
        ...userData,
        password: hashedPassword, // Store hashed password
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(user);
      nextId++;
      return user;
    }
  },

  async findUserByEmail(email) {
    try {
      // Try MongoDB first
      return await User.findOne({ email });
    } catch (error) {
      console.log('Using in-memory storage for user lookup');
      // Fallback to in-memory storage
      return users.find(user => user.email === email);
    }
  },

  async getAllUsers() {
    try {
      // Try MongoDB first
      return await User.find({});
    } catch (error) {
      console.log('Using in-memory storage for user listing');
      // Fallback to in-memory storage
      return users;
    }
  }
};

module.exports = userService;