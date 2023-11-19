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
router.patch('/addFollows/:sa', authController.protect, userController.addFollows);
router.patch('/removeFollows/:sa', authController.protect, userController.removeFollows);

module.exports = router;