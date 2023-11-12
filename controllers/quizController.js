const Quiz = require("./../model/quizModel");
const User = require("./../model/userModel");
const Question = require("./../model/questionModel");
const APIFeatures = require("./../util/APIFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const QuizList = require("../model/quizListModel");

exports.createQuiz = catchAsync(async (req, res, next) => {
    if (!req.body.topic) next(new AppError("Quiz topic not given!", 404));
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

    //3. if no error, create quiz
    const newQuiz = await Quiz.create({
        topic: req.body.topic,
        questions: questionsSoFar
    });

    //4. add that quiz to quizCreated list
    const user = await User.findById(req.user._id);
    const quizCreated = await QuizList.findById(user.quizCreated);
    quizCreated.quizes.push({
        quiz: newQuiz._id,
        choosenOptions: undefined, //because we are creating a quiz
        quizDate: Date.now()
    });
    await quizCreated.save();

    res.status(200).json({
        status: 'success',
        data: {
            newQuiz: newQuiz
        }
    });

});

exports.giveQuiz = catchAsync(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.quizID).populate('questions', "questionString options");
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    res.status(200).json({
        status: 'success',
        data: {
            quiz: quiz
        }
    });
});

exports.submitQuiz = catchAsync(async (req, res, next) => {
    const choosenOptions = req.body.choosenOptions;
    if (!choosenOptions) return next(new AppError("Choosen options not provided", 401))
    const quiz = await Quiz.findById(req.params.quizID).populate('questions');
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    console.log(quiz)

    if (choosenOptions.length !== quiz.questions.length) return next(new AppError("Answer count invalid!", 401));

    let correct = 0;
    let i = 0;
    for (const question of quiz.questions) {
        if (question.correctOption === choosenOptions[i++]?.toLowerCase()) correct++;
    }

    //if there is a user, save it to quizes that user have given
    if (req.user) {
        const user = await User.findById(req.user._id);
        const quizList = await QuizList.findById(user.quizList);
        quizList.quizes.push({
            quiz: quiz._id,
            choosenOptions: choosenOptions,
            quizDate: Date.now()
        });
        await quizList.save();
    }

    res.status(200).json({
        status: 'success',
        total: quiz.questions.length,
        correct: correct,
        choosenOptions: choosenOptions,
        questions: quiz.questions
    });

});