const { TaskItem } = require('../task_item_table');

const moveItem = async (req, res) => {
  const { itemId, taskId } = req.body;
  try {
    const item = await TaskItem.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: '項目未找到' });
    }

    item.task = taskId;
    

    await item.save();

    res.json({
      message: '項目更新成功',
      item: item,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { moveItem };