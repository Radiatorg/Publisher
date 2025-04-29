const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


const accountRoute = require('../controllers/accountController');

router
.get('/', authMiddleware, accountRoute.getAccounts)
.post('/', authMiddleware, accountRoute.create)
.post('/vk', authMiddleware, accountRoute.createVKAccount)
.delete('/:id', authMiddleware, accountRoute.delete)

module.exports = router;
