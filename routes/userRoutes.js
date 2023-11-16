const express = require("express");
const userController = require("./../controllers/userController"); //this format, instead of using path, helps intellisense
const authController = require("./../controllers/authController");
const router = express.Router();


//for creating a user
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
//todo: updateMe is left for advance
router.patch('/updateMe', authController.protect, userController.updateMe);

module.exports = router;