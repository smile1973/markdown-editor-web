const { TaskWithNote } = require('../task_with_note_table');

const connectTaskNote = async (req, res) => {
  const { itemId, noteId } = req.body;

  try {
    const newConnect = new TaskWithNote({
      task: itemId,
      note: noteId
    });

    await newConnect.save();

    res.json({
      message: '連結成功',
      connect: newConnect,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = {
    connectTaskNote
};
