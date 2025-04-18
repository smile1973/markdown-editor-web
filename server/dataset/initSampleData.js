const { User } = require('./user_table');
const { Note } = require('./note_table');
const { Folder } = require('./folder_table');

async function initSampleData() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const user1 = await User.create({
      name: '小江',
      username: '35411134',
      password: '34227604'
    });

    const user2 = await User.create({
      name: '小美',
      username: 'xiaomei',
      password: 'abcdef'
    });

    // 建立資料夾
    const folder1 = await Folder.create({
      name: '學習筆記',
      user: user1._id
    });

    const folder2 = await Folder.create({
      name: '生活雜記',
      user: user1._id,
      folder: folder1._id
    });

    const folder3 = await Folder.create({
      name: '工作記錄',
      user: user2._id
    });

    // 建立筆記，關聯 user 及 folder
    await Note.create([
      {
        name: 'note1',
        content: '這是我的第一篇筆記！',
        user: user1._id,
        folder: folder1._id
      },
      {
        name: 'note2',
        content: '小明今天學會用 mongoose 建立關聯 👏',
        user: user1._id,
        folder: folder2._id
      },
      {
        name: 'note3',
        content: '小美的筆記內容也要記錄一下！',
        user: user2._id,
        folder: folder3._id
      },
      {
        name: 'note3',
        content: '這篇沒資料夾，看預設分組是否正常',
        user: user1._id
      }
    ]);

    console.log('✅ 測試資料初始化完成');
  }
}


module.exports = {initSampleData};