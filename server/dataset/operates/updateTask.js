const { Task } = require('../task_table');

const updateTask = async (req, res) => {
  const { taskId, name } = req.body;
  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: '任務未找到' });
    }

    task.name = name;

    await task.save();

    res.json({
      message: '任務更新成功',
      task: task,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { updateTask };