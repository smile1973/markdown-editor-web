const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Folder = mongoose.model('Folder', folderSchema);

module.exports = {Folder};