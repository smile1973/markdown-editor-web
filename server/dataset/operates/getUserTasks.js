const { Task } = require('../task_table');
const { TaskItem } = require('../task_item_table');

const getUserTasks = async (req, res) => {
  const { userId } = req.query;
  try {
    const tasks = await Task.find({ user: userId });
    const taskIds = tasks.map(task => task._id);

    const taskItems = await TaskItem.find({
      task: { $in: taskIds }
    });

    const itemsByTaskId = {};
    taskItems.forEach(item => {
      const taskId = item.task.toString();
      if (!itemsByTaskId[taskId]) {
        itemsByTaskId[taskId] = [];
      }
      itemsByTaskId[taskId].push(item);
    });

    const tasksWithItems = tasks.map(task => {
      const taskObj = task.toObject(); // 將 Mongoose Document 轉成普通物件
      taskObj.items = itemsByTaskId[task._id.toString()] || [];
      return taskObj;
    });

    res.json({
      message: '成功',
      tasks: tasksWithItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { getUserTasks };