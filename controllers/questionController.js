const Question = require("./../model/questionModel");
const APIFeatures = require("./../util/APIFeatures");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.createQuestion = catchAsync(async (req, res, next) => {

    const newQuestion = await Question.create({
        questionString: req.body.questionString,
        options: req.body.options,
        correctOption: req.body.correctOption.charAt(0)
    });

    res.status(201).json({
        status: 'success', data: {
            tour: newQuestion
        }
    });
});

