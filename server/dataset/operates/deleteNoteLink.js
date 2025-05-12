const { TaskWithNote } = require('../task_with_note_table');


const deleteNoteLink = async (req, res) => {
  const { itemId, noteId } = req.body;
  try {
    await TaskWithNote.deleteOne({ task: itemId, note: noteId });
    
    res.json({
      message: '刪除成功',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { deleteNoteLink };
