const Quiz = require("./../model/quizModel");
const Question = require("./../model/questionModel");
const questionController = require("./../controllers/questionController");
const APIFeatures = require("./../util/APIFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.createQuiz = catchAsync(async (req, res, next) => {

    //1. create all questions
    const questionsSoFar = [];
    let index = 0;
    for (const question of req.body.questions) {
        try {
            console.log(question);
            const ques = await Question.create({
                questionString: question.questionString,
                options: question.options,
                correctOption: question.correctOption.charAt(0)
            });
            questionsSoFar.push(ques._id);
            index++;
        } catch (e) {
            //2. if any error
            //delete questions that have been created
            console.log(questionsSoFar);
            for (const questionCreated of questionsSoFar) {
                await Question.findByIdAndDelete(questionCreated);
            }

            res.status(400).json({
                status: "fail",
                error: e,
                data: {
                    index: index,
                    question: question
                }
            });
        return;
        }
    }

    //3. if no error, return quiz
    const newQuiz = await Quiz.create({
        topic: req.body.topic || "",
        questions: questionsSoFar
    });

    res.status(200).json({
        status: 'success',
        data: {
            newQuiz: newQuiz
        }
    });

});

