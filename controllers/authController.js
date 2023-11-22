const catchAsync = require("../util/catchAsync");
const jwt = require("jsonwebtoken"); //token token token babe '>'
const AppError = require("../util/appError");
const {promisify} = require('util');
const sendEmail = require("../util/email");
const crypto = require("crypto");
const QuizList = require("../model/quizListModel");
const User = require("../model/userModel");
const newsController = require("./newsController");

//returns a jwt token created using given id
const signToken = (id) => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}


//creates a jwt token using user's _id, put it into a cookie and send it as
const createSendToken = (user, status, res) => {
    const token = signToken(user._id);

    //hide password as we are not 'selecting' user == password is still in user object
    user.password = undefined;

    res.status(status).json({
        status: 'success', token, data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {

    const quizList = await QuizList.create({
        quizes: []
    });

    const quizCreated = await QuizList.create({
        quizes: []
    })

    //not simply using req.body due to security reasons
    const newUser = await User.create({
        username: req.body.username, email: req.body.email, name: req.body.name, password: req.body.password, //chillax! this will be encrypted before save
        passwordConfirm: req.body.passwordConfirm, //this will not be stored in DB
        quizList: quizList._id, quizCreated: quizCreated._id, active: true, isAdmin: false //one can be admin only by manually changing data in DB
    });

    //we need a key value for email
    await sendEmail({
        email: newUser.email, subject: "Welcome to Space Odyssey!", message: `
        Dear ${newUser.name},\nWelcome to Space Odyssey! We are excited to have you as a member of our community.\nSpace Odyssey is a website that provides users with a way to explore celestial body data, take quizzes, and explore news related to space. We believe that space is an amazing and fascinating place, and we want to make it accessible to everyone.
        \nWe hope that you will enjoy using Space Odyssey. Please let us know if you have any questions or suggestions.\nSincerely,
        \nThe Space Odyssey Team`
    });

    //_id is the payload we want to put in jwt
    createSendToken(newUser, 201, res);
});


exports.login = catchAsync(async (req, res, next) => {
    const {username, password} = req.body;

    //check if email and password exists => user entered these fields
    if (!username || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    //check if user exists and password is correct
    //we have restricted the default selection of password, so we explicitly select password
    let user = await User.findOne({username}).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect username or password!", 401));
    }
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

    //if all ok, send token to client
    createSendToken(user, 200, res);
});

//makes sure that user is logged in == has a valid bearer token
//if all is good, that user is added to the req
exports.protect = catchAsync(async (req, res, next,) => {
    let token;

    // check if there is a token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please log in again.", 401));
    }

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
    next();
});

//
exports.restrictToAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(new AppError('You dont have permission to perform this action!', 401));
    }
    next();
}


exports.forgotPassword = catchAsync(async (req, res, next) => {
    //protected function will be called before this, so req is supposed to have user
    //get user based on posted email
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        return next(new AppError("No user with that email address.", 404));
    }

    //generate token
    const resetToken = user.createPasswordResetToken();
    //validation is set false because we are not giving, for example a confirm password
    //so save without validation
    await user.save({validateBeforeSave: false});


    //send it to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
    const message = `Forgot password? Sumbit a patch request with your new password and passwordConfirm to:\n
     ${resetUrl}\nPlease ignore this message if you didn't forgot the password!.`;

    try {
        await sendEmail({
            email: user.email, subject: "Reset password token. Valid for 10 min only!", message: message
        });

        res.status(200).json({
            status: 'success', message: 'Token sent to email'
        })
    } catch (err) {
        //if failed to send the email, set these fields to undefined
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('There was an error sending you email! Please try again later!', 500));
    }
});


exports.resetPassword = catchAsync(async (req, res, next) => {
    //1. get user based on token
    //we stored hashed resetToken in database, so hash the resetToken that user gave to compare
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    //get user based on the resetToken and also make sure that token is not expired yet
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});


    //2. if token is not expired and there is a user then set new password
    if (!user) return next(new AppError('Token is invalid or has expired', 400));
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); //pre save functions will check if password and confirm password matches

    //3. updated password changed property of user
    //done in pre('save'.... middleware in userModel

    //4. log the user in, send jwt
    createSendToken(user, 200, res);
});


//user can change his password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
    //1. get user from the collection
    //this is only accessible after user login => req has user object
    const user = await User.findById(req.user._id).select('+password');

    //2. check if posted password is correct
    if (!user || !(await user.correctPassword(req.body.password, user.password))) {
        return next(new AppError("Incorrect email or password!", 401));
    }

    //3. update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4. log in using new password
    createSendToken(user, 200, res);
});


//we have certain routs where having user logged in is optional, so this function will be used to add user to the req
//if there is a valid bearer token. if there is no token, the function will simply return and do nothing
exports.addUserToRequest = async (req, res, next) => {
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
}
