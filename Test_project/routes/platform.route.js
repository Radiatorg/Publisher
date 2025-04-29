const express = require('express');
const router = express.Router();


const platformRoute = require('../controllers/platformController');
router
.get('/', platformRoute.getPlatforms)
.post('/', platformRoute.create)
.delete('/:id', platformRoute.delete);

module.exports = router;
