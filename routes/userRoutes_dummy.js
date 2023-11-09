const express = require("express");

const router = express.Router();
const userControl = require('../controllers/userController');
const authController = require("../controllers/authController");

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);
router.patch('/updateMe', authController.protect, userControl.updateMe);
router.delete('/deleteMe', authController.protect, userControl.deleteMe);

router.route('/').get(userControl.getAllUsers).post(userControl.createUser);
router.route('/:id').get(userControl.getUser).patch(userControl.updateUser).delete(userControl.deleteUser);

module.exports = router;