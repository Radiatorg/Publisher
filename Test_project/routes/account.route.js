const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const accountRoute = require('../controllers/accountController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // файлы остаются в памяти

router
.get('/', authMiddleware, accountRoute.getAccounts.bind(accountRoute))
.post('/', authMiddleware, accountRoute.create.bind(accountRoute))
.post('/vk', authMiddleware, accountRoute.createVKAccount.bind(accountRoute))
.post('/telegram', authMiddleware, accountRoute.createTelegramAccount.bind(accountRoute))
.delete('/:id', authMiddleware, accountRoute.delete.bind(accountRoute))
.get('/:id/communities', authMiddleware, accountRoute.getVKCommunities.bind(accountRoute))
.get('/:id/channels', authMiddleware, accountRoute.getTelegramChannels.bind(accountRoute))
.get('/posts', authMiddleware, upload.array('attachments', 10), accountRoute.getPosts.bind(accountRoute))
.post('/posts', authMiddleware, upload.array('attachments', 10), accountRoute.createPost.bind(accountRoute))
.post('/posts/delete', authMiddleware, accountRoute.deletePost.bind(accountRoute));

module.exports = router;
