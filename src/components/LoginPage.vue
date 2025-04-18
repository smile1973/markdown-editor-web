<template>
  <div class="login-container">
    <h2>登入</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">帳號</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="請輸入帳號"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密碼</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="請輸入密碼"
          required
        />
      </div>
      <button type="submit" class="btn-submit">登入</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    handleLogin() {
      axios.post('/api/login', {
        username: this.username,
        password: this.password
      })
      .then(response => {
        console.log(response.data);
        console.log(response.data.message);
        const { id, name } = response.data.user;
        localStorage.setItem('userId', id);
        localStorage.setItem('userName', name);
        this.$router.push({ name: 'user' });
      })
      .catch(error => {
        if (error.response) {
          if (error.response.status === 401) {
            alert('登入失敗：' + error.response.data.message);
          } else {
            alert('伺服器錯誤，請稍後再試。');
          }
        } else {
          alert('請檢查網路連接，或稍後再試。');
        }
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #1e1e1e;
  color: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  margin-top: 100px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #ffffff;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #cccccc;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #2c2c2c;
  color: #ffffff;
}

input::placeholder {
  color: #888888;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #3a8ee6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1e6bb8;
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}
</style>
