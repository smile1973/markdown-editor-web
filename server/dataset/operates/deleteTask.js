const { Task } = require('../task_table');
const { TaskItem } = require('../task_item_table');

const deleteTask = async (req, res) => {
  const { taskId } = req.body;
  try {
    await Task.deleteOne({ _id: taskId });
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
