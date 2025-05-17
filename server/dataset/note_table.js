const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: false },
    isStarred: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Note = mongoose.model('Note', noteSchema);

module.exports = {Note};