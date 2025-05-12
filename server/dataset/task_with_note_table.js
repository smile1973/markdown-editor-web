const mongoose = require('mongoose');

const taskWithNoteSchema = new mongoose.Schema({
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  });
  
  const TaskWithNote = mongoose.model('TaskWithNote', taskWithNoteSchema);

module.exports = {TaskWithNote};