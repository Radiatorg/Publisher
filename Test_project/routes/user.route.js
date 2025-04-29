const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


const userRoute = require('../controllers/userController');

router.get('/', userRoute.getUsers);
router.post('/', userRoute.create);
router.put('/:id', userRoute.update);
router.delete('/:id', userRoute.delete); 
router.post('/register', userRoute.register);
router.post('/login', userRoute.login);
router.get('/profile', authMiddleware, userRoute.getProfile);

module.exports = router;
