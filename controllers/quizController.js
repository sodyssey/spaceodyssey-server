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
                status: "fail", error: e, data: {
                    index: index, question: question
                }
            });
            return;
        }
    }

    //3. if no error, create quiz
    const newQuiz = await Quiz.create({
        topic: req.body.topic, questions: questionsSoFar
    });

    //4. add that quiz to quizCreated list
    const user = await User.findById(req.user._id);
    const quizCreated = await QuizList.findById(user.quizCreated);
    quizCreated.quizes.unshift({
        quiz: newQuiz._id, choosenOptions: undefined, //because we are creating a quiz
        quizMarks: index, quizDate: Date.now()
    });
    await quizCreated.save();

    res.status(200).json({
        status: 'success', data: {
            newQuiz: newQuiz
        }
    });

});

//todo: if user already given that quiz, raise error
exports.giveQuiz = catchAsync(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.quizID).populate('questions', "questionString options");
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    res.status(200).json({
        status: 'success', data: {
            quiz: quiz
        }
    });
});

//if user already given that quiz, raise error
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
            quiz: quiz._id, choosenOptions: choosenOptions, quizMarks: correct, quizDate: Date.now()
        });
        await quizList.save();
    }

    res.status(200).json({
        status: 'success',
        total: quiz.questions.length,
        quizMarks: correct,
        choosenOptions: choosenOptions,
        questions: quiz.questions
    });
});

//get all the available quizes
exports.getAvailableQuizes = catchAsync(async (req, res, next) => {
    //this approach might have scalability issues '>'

    //get all the quizes available
    let quizes = await Quiz.find().select('topic _id');

    //remove quizes that user has given, if any
    if (req.user) {
        const user = await User.findById(req.user._id);
        const quizList = await QuizList.findById(user.quizList);
        const quizesGiven = quizList.quizes.map(obj => obj.quiz);
        quizes = quizes.filter(quiz => !(quizesGiven.includes(quiz._id)));
    }

    //skip appropriate number of quizes
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    quizes = quizes.slice(skip, skip + limit);

    //return the remaining
    res.status(200).json({
        status: "success", length: quizes.length, data: {
            quizes: quizes
        }
    });
});

//get all the quizes user has submitted
exports.getSubmittedQuizes = catchAsync(async (req, res, next) => {
    //this approach might have scalability issues '>'
    const user = await User.findById(req.user._id);
    const data = [];
    const quizesGiven = await QuizList.findById(user.quizList).populate("quizes.quiz");
    let quizes = quizesGiven.quizes;

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    quizes = quizes.slice(skip, skip + limit);

    for (const quiz of quizes) {
        const toAdd = {};
        toAdd.topic = quiz.quiz.topic;
        toAdd.totalQuestions = quiz.quiz.questions.length;
        toAdd.marksObtained = quiz.quizMarks;
        toAdd.date = quiz.quizDate;
        data.push(toAdd);
    }
    res.status(200).json({
        status: "success", length: data.length, data: data
    });
});

//get all the quizes admin has created
exports.getCreatedQuizes = catchAsync(async (req, res, next) => {
    //this approach might have scalability issues '>'
    const user = await User.findById(req.user._id);
    const data = [];
    const quizesCreated = await QuizList.findById(user.quizCreated).populate("quizes.quiz");
    let quizes = quizesCreated.quizes;

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    quizes = quizes.slice(skip, skip + limit);

    for (const quiz of quizes) {
        const toAdd = {};
        toAdd.topic = quiz.quiz.topic;
        toAdd.totalQuestions = quiz.quizMarks;
        toAdd.date = quiz.quizDate;
        data.push(toAdd);
    }
    res.status(200).json({
        status: "success", length: data.length, data: data
    });
});

