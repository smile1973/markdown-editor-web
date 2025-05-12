const { Task } = require('../task_table');
const { TaskItem } = require('../task_item_table');
const { TaskWithNote } = require('../task_with_note_table');

const deleteTask = async (req, res) => {
  const { taskId } = req.body;
  try {
    await Task.deleteOne({ _id: taskId });

    const itemsToDelete = await TaskItem.find({ task: taskId });
    await TaskWithNote.deleteMany({
      task: { $in: itemsToDelete.map(item => item._id) }
    });

    await TaskItem.deleteMany({ task: taskId });

    res.json({
      message: '任務刪除成功',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { deleteTask };
