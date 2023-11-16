const Quiz = require("./../model/quizModel");
const User = require("./../model/userModel");
const Question = require("./../model/questionModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const QuizList = require("../model/quizListModel");
const {promisify} = require("util");
const jwt = require("jsonwebtoken");


const addUserToRequest = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return;

    // verify the token
    //verify also accepts a callback function, but we will make it return a promise
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists => to check the case if user has jwt token but the user was deleted!
    const freshUser = await User.findOne({_id: decoded.id});
    if (!freshUser) {
        return next(new AppError("The user belonging to this token does not exist.", 401));
    }

    // check if user changed password after jwt was issued
    if (freshUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError("User recently changed their password! Please login again.", 401));
    }

    //grant access to the protected rout
    //also add this user to the request object
    req.user = freshUser;
    console.log("user added to the request!");
}

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

exports.giveQuiz = catchAsync(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.quizID).populate('questions', "questionString options");
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    res.status(200).json({
        status: 'success', data: {
            quiz: quiz
        }
    });
});

exports.submitQuiz = catchAsync(async (req, res, next) => {
    //adding user to the request if there is a bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        await addUserToRequest(req, res, next);
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

        if (quizList.quizes.map(quiz=>quiz.quiz).includes(quiz._id)) return next(new AppError("You have already given this quiz!",400));

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
        await addUserToRequest(req, res, next);
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
        toAdd._id = quiz.quiz._id;
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
        console.log(quiz);
        const toAdd = {};
        toAdd._id = quiz.quiz._id;
        toAdd.topic = quiz.quiz.topic;
        toAdd.totalQuestions = quiz.quizMarks;
        toAdd.date = quiz.quizDate;
        data.push(toAdd);
    }
    res.status(200).json({
        status: "success", length: data.length, data: data
    });
});

exports.getParticularSubmittedQuiz = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("quizList");
    const quiz = await Quiz.findById(req.params.quizID).populate('questions');
    if (!quiz) return next(new AppError("This quiz is not available!", 404));

    let quizDataFromUser = null;
    for (const obj of user.quizList.quizes) {
        console.log(obj.quiz);
        console.log(quiz._id);
        console.log(`${obj.quiz}` === `${quiz._id}`)
        if (`${obj.quiz}` === `${quiz._id}`) quizDataFromUser = obj;
        if (quizDataFromUser) break;
    }

    console.log(quizDataFromUser);

    if (!quizDataFromUser) return next(new AppError("You have not given this quiz", 400));

    const data = {};
    data.topic = quiz.topic;
    data.quizDate = quizDataFromUser.quizDate;
    data.totalQuestions = quiz.questions.length;
    data.marksObtained = quizDataFromUser.quizMarks;
    data.questionAndCorrectAnswers = quiz.questions;
    data.choosenOptions = quizDataFromUser.choosenOptions;

    res.status(200).json({
        status: 'success',
        data: data
    });
});


exports.getParticularCreatedQuiz = catchAsync(async (req, res, next) => {
    //topic
    //date
    //totalQuestions
    //allQuestions
    //correctOptions
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
        status: 'success',
        data: data
    });
});

