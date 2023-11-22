const User = require("./../model/userModel");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");
const newsController = require("./newsController");
const authController = require("./authController");


//only keeps allowedFields in obj
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

//let name, avatar, follows of a user get updated
const updateMe = catchAsync(async (req, res, next) => {
    //1. if trying to update password, raise an error
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError('This route is not for password reset. please go to /updateMyPassword', 400));

    //2. update otherwise
    //we want to let user change name, avatar, follows only, hence filter out unwanted fields
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
});

exports.addFollows = async (req, res, next) => {
    //todo: duplication potential exists
    const user = await User.findById(req.user._id);
    const follows = user.follows;
    const sa = req.params.sa;

    if (follows.indexOf(sa) < 0) //if this space agency is not in follows
        follows.push(sa);
    req.body.follows = follows; //because we are going to call updateMe
    await updateMe(req, res, next);
};

exports.removeFollows = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const follows = user.follows;
    const sa = req.params.sa;
    const index = follows.indexOf(sa);
    if (index > -1)
        follows.splice(index, 1);
    req.body.follows = follows; //because we are going to call updateMe
    await updateMe(req, res, next);
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    //1. get user from the collection
    //this is only accessible after user login hence req has user
    let user = await User.findById(req.user._id).select('+password');

    //2. check if posted password is correct
    if (!user || !req.body.password || !(await user.correctPassword(req.body.password, user.password))) {
        return next(new AppError("Incorrect password!", 401));
    }

    user = await User.findByIdAndUpdate(req.user._id, {active: false});

    //we won't see the response in postman as status code is 204
    res.status(204).json({
        status: 'success',
        message: "User deleted!",
        data: null
    });

});

exports.getUser = catchAsync(async (req, res, next) => {
    let user = await User.findById(req.body.userid);
    user = {...user}._doc;

    //adding images link to follows attribute of user
    const follows = [];
    const newsImages = newsController.newsImages;
    for (const sa of user.follows) {
        const toAdd = {};
        toAdd.name = sa;
        toAdd.image = newsImages[sa];
        follows.push(toAdd);
    }
    user.follows = follows;

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });

});