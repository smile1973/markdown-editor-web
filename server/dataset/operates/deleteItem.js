const { TaskItem } = require('../task_item_table');
const { TaskWithNote } = require('../task_with_note_table');

const deleteItem = async (req, res) => {
  const { itemId } = req.body;
  try {
    await TaskItem.deleteOne({ _id: itemId });
    await TaskWithNote.deleteMany({ task: itemId });
    
    res.json({
      message: '項目刪除成功',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { deleteItem };
