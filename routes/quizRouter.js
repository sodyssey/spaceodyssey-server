const express = require("express");
const quizController = require("./../controllers/quizController");
const authController = require("./../controllers/authController");
const router = express.Router();

//for creating a quiz
//todo: restrict to admin only
router.route('/createQuiz').post(authController.protect, authController.restrictToAdmin,quizController.createQuiz);
router.route('/giveQuiz/:quizID').get(quizController.giveQuiz);
router.route('/submitQuiz/:quizID').get(quizController.submitQuiz);

module.exports = router;