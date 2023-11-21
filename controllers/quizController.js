const Quiz = require("./../model/quizModel");
const User = require("./../model/userModel");
const Question = require("./../model/questionModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const QuizList = require("../model/quizListModel");
const authController = require("./authController");

const ENTRIES_PER_PAGE = 100;

//admin can create a quiz
exports.createQuiz = catchAsync(async (req, res, next) => {
    if (!req.body.topic) next(new AppError("Quiz topic not given!", 400));
    //1. create all questions
    const questionsSoFar = [];
    let index = 0;
    for (const question of req.body.questions) {
        try {
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
    //we want to add new quiz in the beginning of quizCreated array, so we dont have to sort when displaying
    quizCreated.quizes.unshift({
        quiz: newQuiz._id, choosenOptions: undefined, //because we are creating a quiz
        quizMarks: index, //it stands for total number of question
        quizDate: Date.now()
    });
    await quizCreated.save();

    res.status(200).json({
        status: 'success', data: {
            newQuiz: newQuiz
        }
    });

});

//returns a quiz data so that user can give it
exports.giveQuiz = catchAsync(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.quizID).populate('questions', "questionString options");
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    res.status(200).json({
        status: 'success', data: {
            quiz: quiz
        }
    });
});

//submit a quiz =>
// if user is logged in => add the quiz to his quizList and return result
// if no user, simply return result
exports.submitQuiz = catchAsync(async (req, res, next) => {
    //adding user to the request if there is a bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        await authController.addUserToRequest(req, res, next);
    }

    const choosenOptions = req.body.choosenOptions;
    if (!choosenOptions) return next(new AppError("Choosen options not provided", 400));
    const quiz = await Quiz.findById(req.params.quizID).populate('questions');
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    if (choosenOptions.length !== quiz.questions.length) return next(new AppError("Answer count invalid!", 400));

    let correct = 0;
    let i = 0;
    for (const question of quiz.questions) {
        if (question.correctOption === choosenOptions[i++]?.toLowerCase()) correct++;
    }

    //if there is a user, save it to quizes that user have given
    if (req.user) {
        const user = await User.findById(req.user._id);
        const quizList = await QuizList.findById(user.quizList);

        if (quizList.quizes.map(quiz => quiz.quiz).includes(quiz._id)) return next(new AppError("You have already given this quiz!", 403));

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
    //adding the user to the request, if there is a user
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        await authController.addUserToRequest(req, res, next);
    }

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
    //per page ENTRIES_PER_PAGE quizes
    const offset = req.params.offset * 1 || 0;
    let loadMore = null;
    if (offset + ENTRIES_PER_PAGE < quizes.length) loadMore = `/quiz/getQuizes/${offset + ENTRIES_PER_PAGE}`
    quizes = quizes.slice(offset, offset + ENTRIES_PER_PAGE);

    //return the remaining

    res.status(200).json({
        status: "success",
        data: {
            length: quizes.length,
            loadMore: loadMore,
            quizes: quizes
        }
    });
});

//get all the quizes user has submitted
exports.getSubmittedQuizes = catchAsync(async (req, res, next) => {
    //this approach might have scalability issues '>'
    const user = await User.findById(req.user._id);
    const quizesSubmitted = [];
    const quizesGiven = await QuizList.findById(user.quizList).populate("quizes.quiz");
    let quizes = quizesGiven.quizes;

    //skip appropriate number of quizes
    //per page ENTRIES_PER_PAGE quizes
    const offset = req.params.offset * 1 || 0;
    let loadMore = null;
    if (offset + ENTRIES_PER_PAGE < quizes.length) loadMore = `/quiz/getSubmittedQuizes/${offset + ENTRIES_PER_PAGE}`
    quizes = quizes.slice(offset, offset + ENTRIES_PER_PAGE);

    for (const quiz of quizes) {
        const toAdd = {};
        toAdd._id = quiz.quiz._id;
        toAdd.topic = quiz.quiz.topic;
        toAdd.totalQuestions = quiz.quiz.questions.length;
        toAdd.marksObtained = quiz.quizMarks;
        toAdd.date = quiz.quizDate;
        quizesSubmitted.push(toAdd);
    }
    res.status(200).json({
        status: "success", data: {
            length: quizesSubmitted.length,
            loadMore,
            quizesSubmitted
        }
    });
});

//get all the quizes admin has created
exports.getCreatedQuizes = catchAsync(async (req, res, next) => {
    //this approach might have scalability issues '>'
    const user = await User.findById(req.user._id);
    const quizesCreated = [];
    const quizesCreatedRaw = await QuizList.findById(user.quizCreated).populate("quizes.quiz");
    let quizes = quizesCreatedRaw.quizes;

    //skip appropriate number of quizes
    //per page ENTRIES_PER_PAGE quizes
    const offset = req.params.offset * 1 || 0;
    let loadMore = null;
    if (offset + ENTRIES_PER_PAGE < quizes.length) loadMore = `/quiz/getCreatedQuizes/${offset + ENTRIES_PER_PAGE}`
    quizes = quizes.slice(offset, offset + ENTRIES_PER_PAGE);


    for (const quiz of quizes) {
        const toAdd = {};
        toAdd._id = quiz.quiz._id;
        toAdd.topic = quiz.quiz.topic;
        toAdd.totalQuestions = quiz.quizMarks;
        toAdd.date = quiz.quizDate;
        quizesCreated.push(toAdd);
    }
    res.status(200).json({
        status: "success", data: {
            length: quizesCreated.length,
            loadMore,
            quizesCreated
        }
    });
});

exports.getParticularSubmittedQuiz = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("quizList");
    const quiz = await Quiz.findById(req.params.quizID).populate('questions');
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    let quizDataFromUser = null;
    for (const obj of user.quizList.quizes) {
        if (`${obj.quiz}` === `${quiz._id}`) quizDataFromUser = obj;
        if (quizDataFromUser) break;
    }

    if (!quizDataFromUser) return next(new AppError("You have not given this quiz", 400));

    const data = {};
    data.topic = quiz.topic;
    data.quizDate = quizDataFromUser.quizDate;
    data.totalQuestions = quiz.questions.length;
    data.marksObtained = quizDataFromUser.quizMarks;
    data.questionAndCorrectAnswers = quiz.questions;
    data.choosenOptions = quizDataFromUser.choosenOptions;

    res.status(200).json({
        status: 'success', data: data
    });
});


exports.getParticularCreatedQuiz = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("quizCreated");
    const quiz = await Quiz.findById(req.params.quizID).populate('questions');
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    let quizDataFromUser = null;
    for (const obj of user.quizCreated.quizes) {
        if (`${obj.quiz}` === `${quiz._id}`) quizDataFromUser = obj;
        if (quizDataFromUser) break;
    }

    if (!quizDataFromUser) return next(new AppError("You have not given this quiz", 400));

    const data = {};
    data.topic = quiz.topic;
    data.quizDate = quizDataFromUser.quizDate;
    data.totalQuestions = quizDataFromUser.quizMarks;
    data.questionAndCorrectAnswers = quiz.questions;

    res.status(200).json({
        status: 'success', data: data
    });
});

