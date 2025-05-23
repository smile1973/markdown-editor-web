const { Note } = require('../../dataset/note_table');

const getNote = async (req, res) => {
  const { noteId } = req.query;
  try {
    const note = await Note.find({ _id : noteId});
    res.json({
      message: '成功',
      note: note,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { getNote };