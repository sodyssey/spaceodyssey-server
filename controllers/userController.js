const User = require("./../model/userModel");
const APIFeatures = require("./../util/APIFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.createUser = catchAsync(async (req, res, next) => {

    /*
    * todo: implement pre save security features
    * 1. encrypt password (done)
    * 2. remove confirm password (done)
    * ?? what else ??
    * */

    //not simply using req.body due to security reasons
    const newUser = await User.create({
        username: req.body.username,
        email: req.body.email,
        name: req.body.name,
        password: req.body.password, //chillax! this will be encrypted before save
        passwordConfirm: req.body.passwordConfirm, //this will not be stored in DB
        active: true,
        isAdmin: false //one can be admin only by manually changing data in DB
    });

    res.status(201).json({
        status: 'success', data: {
            tour: newUser
        }
    });
});

