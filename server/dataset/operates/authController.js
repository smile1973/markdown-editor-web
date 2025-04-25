const { User } = require('../../dataset/user_table');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: '使用者不存在' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: '密碼錯誤' });
    }

    res.json({ message: '登入成功', user: { id: user._id, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    // 檢查使用者名稱是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '使用者名稱已存在' });
    }

    // 創建新使用者
    const newUser = new User({
      name,
      username,
      password
    });

    await newUser.save();
    res.status(201).json({ message: '註冊成功', user: { id: newUser._id, name: newUser.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

module.exports = { login, register };