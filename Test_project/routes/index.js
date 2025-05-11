var express = require('express');
var router = express.Router();
const indexController = require('../controllers/indexController');
const userRoute =require('./user.route')
const platformRoute =require('./platform.route')
const accountRoute =require('./account.route')
const telegramRoute =require('./telegram.route')


router.get('/', indexController.index);

const defaultRoutes = [
    {
      path: '/users',
      route: userRoute,
    },
    {
        path: '/platforms',
        route: platformRoute,
    },
    {
      path: '/accounts',
      route: accountRoute,
    },
    {
      path: '/telegram',
      route: telegramRoute,
    },
]  
  defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
  
 module.exports = router;