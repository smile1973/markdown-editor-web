const { Task } = require('../task_table');

const createTask = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: '缺少必要參數 name 或 userId' });
  }

  try {
    const newTask = new Task({
      name: '新表格',
      user: userId,
    });

    await newTask.save();

    res.json({
      message: '表格建立成功',
      task: newTask,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  createTask
};