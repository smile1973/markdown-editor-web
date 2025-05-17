const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  securityQuestion: { type: String },
  securityAnswer: { type: String },
  avatarUrl: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = {User};