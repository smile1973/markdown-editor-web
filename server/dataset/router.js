const express = require('express');
const router = express.Router();
const { login } = require('./operates/authController');
const { getUserNotes } = require('./operates/getUserNotes');
const { getUserFolders } = require('./operates/getUserFolders');
const { createFolder } = require('./operates/createFolder');
const { createNote } = require('./operates/createNote');
const { getNote } = require('./operates/getNote');
const { updateNote } = require('./operates/updateNote');
const { renameFolder } = require('./operates/renameFolder');
const { deleteNote } = require('./operates/deleteNote');
const { deleteFolder } = require('./operates/deleteFolder');

router.post('/login', login);
router.post('/getUserNotes', getUserNotes);
router.post('/getUserFolders', getUserFolders);
router.post('/createFolder', createFolder);
router.post('/createNote', createNote);
router.post('/getNote', getNote);
router.post('/updateNote', updateNote);
router.post('/renameFolder', renameFolder);
router.post('/deleteNote', deleteNote);
router.post('/deleteFolder', deleteFolder);

module.exports = router;