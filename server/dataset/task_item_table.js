const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
    name: { type: String, required: false },
    state: { type: String, enum: ['未開始', '進行中', '完成'], required: false },
    content: { type: String, required: false },
    time: {type: Date, required: false},
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  const TaskItem = mongoose.model('TaskItem', taskItemSchema);

module.exports = {TaskItem};