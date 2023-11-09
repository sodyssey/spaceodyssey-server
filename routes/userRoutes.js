const express = require("express");
const userController = require("./../controllers/userController"); //this format, instead of using path, helps intellisense
const authController = require("./../controllers/authController");
const router = express.Router();


//for creating a user
router.route('/').post(userController.createUser);

module.exports = router;