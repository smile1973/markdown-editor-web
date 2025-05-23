const express = require('express');
const router = express.Router();
const { login, register } = require('./operates/authController');
const { getUserNotes } = require('./operates/getUserNotes');
const { getUserFolders } = require('./operates/getUserFolders');
const { createFolder } = require('./operates/createFolder');
const { createNote } = require('./operates/createNote');
const { getNote } = require('./operates/getNote');
const { updateNote } = require('./operates/updateNote');
const { renameFolder } = require('./operates/renameFolder');
const { deleteNote } = require('./operates/deleteNote');
const { deleteFolder } = require('./operates/deleteFolder');
const { uploadImage } = require('./operates/uploadImage');
const { createTask } = require('./operates/createTask');
const { getUserTasks } = require('./operates/getUserTasks');
const { createTaskItem } = require('./operates/createTaskItem');
const { updateItem } = require('./operates/updateItem');
const { updateTask } = require('./operates/updateTask');
const { deleteTask } = require('./operates/deleteTask');
const { deleteItem } = require('./operates/deleteItem');
const { connectTaskNote } = require('./operates/connectTaskNote');
const { getTaskNotes } = require('./operates/getTaskNotes');
const { deleteNoteLink } = require('./operates/deleteNoteLink');
const { moveItem } = require('./operates/moveItem');
const { 
  setSecurityQuestion, 
  getSecurityQuestion, 
  recoverPassword,
  updateUsername,
  updateAvatar,
  updatePassword,
  getUserInfo,
  fetchSecurityQuestion
} = require('./operates/userSettingsController');
const { toggleShareNote } = require('./operates/shareNoteController');
const {
  addTagToNote,
  removeTagFromNote,
  getUserTags
} = require('./operates/noteTagsController');

router.post('/login', login);
router.post('/register', register);
router.get('/getUserNotes', getUserNotes);
router.get('/getUserFolders', getUserFolders);
router.post('/createFolder', createFolder);
router.post('/createNote', createNote);
router.get('/getNote', getNote);
router.put('/updateNote', updateNote);
router.put('/renameFolder', renameFolder);
router.delete('/deleteNote', deleteNote);
router.delete('/deleteFolder', deleteFolder);
router.post('/createTask', createTask);
router.get('/getUserTasks', getUserTasks);
router.post('/createTaskItem', createTaskItem);
router.put('/updateItem', updateItem);
router.put('/updateTask', updateTask);
router.delete('/deleteTask', deleteTask);
router.delete('/deleteItem', deleteItem);
router.post('/connectTaskNote', connectTaskNote);
router.get('/getTaskNotes', getTaskNotes);
router.delete('/deleteNoteLink', deleteNoteLink);
router.post('/moveItem', moveItem);

// ##################################################
router.post('/uploadImage', uploadImage);
router.post('/setSecurityQuestion', setSecurityQuestion);
router.post('/getSecurityQuestion', getSecurityQuestion);
router.post('/recoverPassword', recoverPassword);
router.post('/updateUsername', updateUsername);
router.post('/updateAvatar', updateAvatar);
router.post('/updatePassword', updatePassword);
router.post('/getUserInfo', getUserInfo);
router.post('/fetchSecurityQuestion', fetchSecurityQuestion);
router.post('/shareNote', toggleShareNote);

// 標籤相關的 API 路由
router.post('/addTagToNote', addTagToNote);
router.post('/removeTagFromNote', removeTagFromNote);
router.get('/user/:userId/tags', getUserTags);

module.exports = router;