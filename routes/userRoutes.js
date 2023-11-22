const express = require("express");
const userController = require("./../controllers/userController"); //this format, instead of using path, helps intellisense
const authController = require("./../controllers/authController");
const router = express.Router();

//get details about a user using jwtToken
router.get('/profile/', authController.protect, userController.getUser);
//for signing up
router.post('/signup', authController.signup);
//for loging in
router.post('/login', authController.login);
//if user forgot password
router.post('/forgotPassword', authController.forgotPassword);
//user can reset password using link he receives in email
router.patch('/resetPassword/:token', authController.resetPassword);
//user can change password using his previous password
router.patch('/updateMyPassword', authController.protect, authController.updateMyPassword);
//user can delete himself
//todo: revert changes after debug
router.post('/deleteMe', authController.protect, userController.deleteMe);
//user can add spaceAgency to his follows list
router.patch('/addFollows/:sa', authController.protect, userController.addFollows);
//user can remove a spaceAgency from his follows list
router.patch('/removeFollows/:sa', authController.protect, userController.removeFollows);
//user can update multiple fields
router.patch('/updateMe', authController.protect, userController.updateMe);

module.exports = router;