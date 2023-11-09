const express = require("express");
const questionController = require("./../controllers/questionController"); //this format, instead of using path, helps intellisense
const authController = require("./../controllers/authController");
const router = express.Router();

//for creating a user
router.route('/').post(questionController.createQuestion);

module.exports = router;