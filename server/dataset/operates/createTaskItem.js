const { TaskItem } = require('../task_item_table');

const createTaskItem = async (req, res) => {
  const { taskId } = req.body;

  if ( !taskId) {
    return res.status(400).json({ message: '缺少必要參數taskId' });
  }

  try {
    const newTaskItem = new TaskItem({
      task: taskId
    });

    await newTaskItem.save();

    res.json({
      message: '項目建立成功',
      item: newTaskItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
  createTaskItem
};