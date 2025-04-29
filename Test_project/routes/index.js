var express = require('express');
var router = express.Router();
const indexController = require('../controllers/indexController');
const userRoute =require('./user.route')
const platformRoute =require('./platform.route')
const accountRoute =require('./account.route')


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
]  
  defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
  
 module.exports = router;