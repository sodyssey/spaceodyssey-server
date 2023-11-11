const User = require("./../model/userModel");
const QuizList = require("./../model/quizListModel");
const APIFeatures = require("./../util/APIFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createUser = catchAsync(async (req, res, next) => {
    const quizList = await QuizList.create({
        quizes: []
    });
    //not simply using req.body due to security reasons
    const newUser = await User.create({
        username: req.body.username, email: req.body.email, name: req.body.name, password: req.body.password, //chillax! this will be encrypted before save
        passwordConfirm: req.body.passwordConfirm, //this will not be stored in DB
        quizList: quizList._id, active: true, isAdmin: false //one can be admin only by manually changing data in DB
    });
    res.status(201).json({
        status: 'success', data: {
            tour: newUser
        }
    });
});

exports.updateMe = async (req, res, next) => {
    //1. if trying to update password, raise an error
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError('This route is not for password reset. please go to /updateMyPassword', 400));

    //2. update otherwise
    //we want to let user change name and email only, hence filter out unwanted fields
    const filteredBody = filterObj(req.body, 'name', 'avatar', 'follows');
    //using findByIdAndUpdate instead of typical user.save() because we are not working with passwords and no need to complicate stuff
    //new: true=> send the updated user
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {new: true, runValidators: true});


    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user._id,{active: false});

    //we won't see the response in postman as status code is 204
    res.status(204).json({
        status: 'success',
        data:null
    });

});