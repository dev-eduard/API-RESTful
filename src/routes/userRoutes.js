const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { validateLogin, loginLimiter, validateRegister } = require('../controllers/userController');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, userController.createUser);
router.post('/register', validateRegister, userController.createUser);
router.post('/login', loginLimiter, validateLogin, userController.loginUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);


module.exports = router;
