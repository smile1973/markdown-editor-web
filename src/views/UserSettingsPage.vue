<template>
  <div class="settings-container">
    <!-- 頂部導航區 -->
    <div class="top-nav">
      <button class="back-button" @click="goBack">&larr; 返回</button>
    </div>
    
    <h1>使用者設定</h1>
    <div class="settings-section">
      <h2>安全問題設定</h2>
      <div v-if="hasSecurityQuestion">
        <p>您已設定安全問題：{{ securityQuestion }}</p>
        <button class="update-button" @click="showSecurityForm = true">變更安全問題</button>
      </div>
      <div v-else-if="!showSecurityForm">
        <p>尚未設定安全問題。設定安全問題可在忘記密碼時協助您恢復帳號。</p>
        <button class="update-button" @click="showSecurityForm = true">設定安全問題</button>
      </div>
      <div v-if="showSecurityForm" class="security-form">
        <div class="form-group">
          <label for="securityQuestionInput">安全問題</label>
          <input
            type="text"
            id="securityQuestionInput"
            v-model="securityQuestion"
            placeholder="例如：您的出生地是哪裡？"
            required
          />
        </div>
        <div class="form-group">
          <label for="securityAnswerInput">安全問題答案</label>
          <input
            type="text"
            id="securityAnswerInput"
            v-model="securityAnswer"
            placeholder="請輸入問題答案"
            required
          />
        </div>
        <div class="button-group">
          <button class="save-button" @click="saveSecurityQuestion">儲存</button>
          <button class="cancel-button" @click="cancelSecurityForm">取消</button>
        </div>
        <p v-if="securityMessage" :class="['message', securityMessageType]">{{ securityMessage }}</p>
      </div>
    </div>
    <div class="settings-section">
      <h2>使用者資料修改</h2>
      <div class="user-form">
        <!-- 頭像修改 -->
        <div class="avatar-container">
          <img v-if="avatarPreview" :src="getAvatarUrl(avatarPreview)" alt="Avatar" class="avatar"/>
          <div v-else class="avatar-placeholder">{{ userName.charAt(0).toUpperCase() }}</div>
          <div class="avatar-buttons">
            <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="file-input"/>
            <button class="upload-button" @click="triggerFileInput">選擇頭像</button>
            <div v-if="selectedFile" class="selected-actions">
              <button class="save-button" @click="uploadAvatar">使用頭像</button>
              <button class="cancel-button" @click="cancelAvatarSelection">取消</button>
            </div>
          </div>
        </div>
        <p v-if="avatarMessage" :class="['message', avatarMessageType]">{{ avatarMessage }}</p>
        
        <!-- 使用者名稱修改 -->
        <div class="form-group">
          <label for="userName">使用者名稱</label>
          <input type="text" id="userName" v-model="newUserName" placeholder="輸入新的使用者名稱" />
          <button class="save-button" @click="updateUserName">更新名稱</button>
        </div>
        <p v-if="userNameMessage" :class="['message', userNameMessageType]">{{ userNameMessage }}</p>

        <!-- 密碼修改 -->
        <div class="form-group">
          <label for="oldPassword">目前密碼</label>
          <input type="password" id="oldPassword" v-model="oldPassword" placeholder="輸入目前密碼" />
        </div>
        <div class="form-group">
          <label for="newPassword">新密碼</label>
          <input type="password" id="newPassword" v-model="newPassword" placeholder="輸入新密碼" />
        </div>
        <div class="form-group">
          <label for="confirmPassword">確認新密碼</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="再次輸入新密碼" />
          <button class="save-button" @click="updateUserPassword">更新密碼</button>
        </div>
        <p v-if="passwordMessage" :class="['message', passwordMessageType]">{{ passwordMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserSettingsPage',
  data() {
    return {
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('userName') || '',
      newUserName: localStorage.getItem('userName') || '',
      showSecurityForm: false,
      hasSecurityQuestion: false,
      securityQuestion: '',
      securityAnswer: '',
      securityMessage: '',
      securityMessageType: 'success',
      
      avatarUrl: '',
      avatarPreview: null,
      selectedFile: null,
      avatarMessage: '',
      avatarMessageType: 'success',

      userNameMessage: '',
      userNameMessageType: 'success',

      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      passwordMessage: '',
      passwordMessageType: 'success'
    };
  },
  mounted() {
    this.fetchSecurityQuestion();
    this.fetchUserInfo();
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'user' });
    },
    getAvatarUrl(url) {
      if (!url) return null;
      console.log('原始頭像URL:', url);
      
      // 如果URL是數據URL或已經是完整URL，則直接返回
      if (url.startsWith('data:') || url.startsWith('http')) {
        return url;
      }
      
      // 添加時間戳防止緩存
      const timestamp = new Date().getTime();
      
      // 使用API伺服器的URL（5000端口）而非前端開發伺服器
      const apiBaseUrl = 'http://localhost:5000';
      
      // 直接訪問格式的URL
      if (url.startsWith('/avatar/')) {
        const avatarUrl = `${apiBaseUrl}${url}?t=${timestamp}`;
        console.log('構建頭像URL:', avatarUrl);
        return avatarUrl;
      }
      
      // 普通的相對路徑
      const standardUrl = `${apiBaseUrl}${url}?t=${timestamp}`;
      console.log('標準頭像URL:', standardUrl);
      return standardUrl;
    },
    async fetchSecurityQuestion() {
      try {
        const response = await axios.get('/api/getSecurityQuestion', {
          params: {
            userId: this.userId
          }
        });
        this.hasSecurityQuestion = response.data.hasSecurityQuestion;
        if (this.hasSecurityQuestion) {
          this.securityQuestion = response.data.securityQuestion;
        }
      } catch (error) {
        console.error('獲取安全問題失敗:', error);
      }
    },
    async saveSecurityQuestion() {
      if (!this.securityQuestion || !this.securityAnswer) {
        this.securityMessage = '請填寫安全問題和答案';
        this.securityMessageType = 'error';
        return;
      }

      try {
        await axios.post('/api/setSecurityQuestion', {
          userId: this.userId,
          securityQuestion: this.securityQuestion,
          securityAnswer: this.securityAnswer
        });

        this.securityMessage = '安全問題設定成功';
        this.securityMessageType = 'success';
        this.hasSecurityQuestion = true;
        this.showSecurityForm = false;
        this.securityAnswer = ''; 
      } catch (error) {
        console.error('設定安全問題失敗:', error);
        this.securityMessage = '設定失敗，請稍後再試';
        this.securityMessageType = 'error';
      }
    },
    cancelSecurityForm() {
      this.showSecurityForm = false;
      if (!this.hasSecurityQuestion) {
        this.securityQuestion = '';
      }
      this.securityAnswer = '';
      this.securityMessage = '';
    },
    async fetchUserInfo() {
      try {
        const response = await axios.get('/api/getUserInfo', {
          params: { userId: this.userId }
        });
        const user = response.data.user;
        this.newUserName = user.name;
        this.userName = user.name; 
        if (user.avatarUrl) {
          this.avatarUrl = user.avatarUrl;
          this.avatarPreview = user.avatarUrl; 
          localStorage.setItem('userAvatar', user.avatarUrl);
        } else {
          this.avatarUrl = null;
          this.avatarPreview = null;
          localStorage.removeItem('userAvatar');
        }
      } catch (error) {
        console.error('獲取使用者資料失敗:', error);
        this.avatarUrl = null;
        this.avatarPreview = null;
        localStorage.removeItem('userAvatar');
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.avatarPreview = e.target.result;
        };
        reader.readAsDataURL(file);
        this.avatarMessage = '';
      }
    },
    cancelAvatarSelection() {
      this.selectedFile = null;
      // 恢復到原始頭像或預設頭像
      if (this.avatarUrl) {
        this.avatarPreview = this.avatarUrl;
      } else {
        this.avatarPreview = null;
      }
      this.avatarMessage = '';
    },
    async uploadAvatar() {
      if (!this.selectedFile) {
        this.avatarMessage = '請先選擇一個文件';
        this.avatarMessageType = 'error';
        return;
      }

      // 確認 userId 存在
      if (!this.userId) {
        this.avatarMessage = '用戶 ID 無效，請重新登入後再試';
        this.avatarMessageType = 'error';
        return;
      }

      const formData = new FormData();
      formData.append('avatar', this.selectedFile);
      formData.append('userId', this.userId);

      try {
        console.log('開始上傳頭像，用戶ID:', this.userId);
        const response = await axios.post('/api/updateAvatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('頭像上傳響應:', response.data);
        
        // 更新本地頭像URL和預覽
        this.avatarUrl = response.data.avatarUrl;
        
        // 使用完整URL進行預覽
        const fullUrl = this.getAvatarUrl(this.avatarUrl);
        console.log('完整頭像URL:', fullUrl);
        this.avatarPreview = fullUrl;
        
        // 保存到localStorage
        localStorage.setItem('userAvatar', this.avatarUrl);
        
        this.avatarMessage = '頭像上傳成功';
        this.avatarMessageType = 'success';
        this.selectedFile = null;
        
        // 觸發事件通知頭像已更改
        this.$emit('avatar-updated', this.avatarUrl);
        
        // 通過事件總線通知所有組件頭像已更改
        if (window.$bus) {
          window.$bus.emit('avatar-updated', this.avatarUrl);
          console.log('已通過事件總線發送頭像更新事件');
        }
        
        console.log('頭像已成功上傳並保存:', this.avatarUrl);
        
        // 驗證頭像文件是否可訪問
        try {
          const checkResponse = await axios.get(`/check-file/${this.avatarUrl.split('/').pop()}`);
          console.log('頭像文件檢查結果:', checkResponse.data);
        } catch (checkError) {
          console.error('頭像文件檢查失敗:', checkError);
        }
      } catch (error) {
        console.error('頭像上傳失敗:', error);
        this.avatarMessage = '頭像上傳失敗，請稍後再試';
        if (error.response && error.response.data && error.response.data.message) {
          this.avatarMessage = error.response.data.message;
        }
        this.avatarMessageType = 'error';
      }
    },
    async updateUserName() {
      if (!this.newUserName.trim()) {
        this.userNameMessage = '使用者名稱不能為空';
        this.userNameMessageType = 'error';
        return;
      }
      try {
        await axios.put('/api/updateUsername', {
          userId: this.userId,
          newName: this.newUserName
        });
        this.userName = this.newUserName;
        localStorage.setItem('userName', this.newUserName);
        this.userNameMessage = '使用者名稱更新成功';
        this.userNameMessageType = 'success';
      } catch (error) {
        console.error('更新使用者名稱失敗:', error);
        this.userNameMessage = '更新使用者名稱失敗，請稍後再試';
        this.userNameMessageType = 'error';
      }
    },
    async updateUserPassword() {
      if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
        this.passwordMessage = '所有密碼欄位都必須填寫';
        this.passwordMessageType = 'error';
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.passwordMessage = '新密碼與確認密碼不符';
        this.passwordMessageType = 'error';
        return;
      }
      // 可在此處添加新密碼強度驗證
      try {
        await axios.put('/api/updatePassword', {
          userId: this.userId,
          oldPassword: this.oldPassword,
          newPassword: this.newPassword
        });
        this.passwordMessage = '密碼更新成功';
        this.passwordMessageType = 'success';
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (error) {
        console.error('更新密碼失敗:', error);
        if (error.response && error.response.status === 401) {
          this.passwordMessage = '原密碼不正確';
        } else {
          this.passwordMessage = '更新密碼失敗，請稍後再試';
        }
        this.passwordMessageType = 'error';
      }
    }
  }
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.top-nav {
  margin-bottom: 20px;
}

.back-button {
  padding: 8px 16px;
  background-color: #555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: auto;
}

.back-button:hover {
  background-color: #444;
}

.settings-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #1e1e1e;
  color: #f0f0f0;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #ffffff;
}

h2 {
  color: #3a8ee6;
  margin-bottom: 15px;
}

.security-form, .user-form {
  margin-top: 20px;
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
  margin-bottom: 10px; /* Add some space below input fields */
}

.form-group input[type="text"],
.form-group input[type="password"] {
  margin-bottom: 10px; 
}

.form-group button {
  margin-top: 5px;
  width: auto;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.save-button, .update-button {
  padding: 8px 16px;
  background-color: #3a8ee6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover, .update-button:hover {
  background-color: #1e6bb8;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #666666;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #555555;
}

.message {
  margin-top: 15px;
  padding: 8px;
  border-radius: 4px;
}

.message.success {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.message.error {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.avatar-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 20px;
  border: 2px solid #555;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  border: 2px solid #555;
  font-size: 24px;
  color: #fff;
}

.avatar-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.file-input {
  display: none;
}

.upload-button {
  padding: 8px 16px;
  background-color: #666666;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: auto;
}

.upload-button:hover {
  background-color: #555555;
}

button {
  width: auto;
}
</style> 