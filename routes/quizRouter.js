const express = require("express");
const quizController = require("./../controllers/quizController");
const authController = require("./../controllers/authController");
const router = express.Router();

//for creating a quiz
//todo: restrict to admin only
router.route('/').post(quizController.createQuiz);

module.exports = router;