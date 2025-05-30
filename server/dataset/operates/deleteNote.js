const { Note } = require('../../dataset/note_table');
const { TaskWithNote } = require('../task_with_note_table');

const deleteNote = async (req, res) => {
  const { noteId } = req.body;

  try {
    await Note.deleteOne({ _id: noteId });
    await TaskWithNote.deleteMany({ note: noteId });

    res.json({
      message: '筆記刪除成功',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { deleteNote };
