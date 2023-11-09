const mongoose = require('mongoose');


const quizListSchema = new mongoose.Schema({

    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }, quizes:{
        type: [{
            quiz: {
                type: mongoose.Schema.ObjectId,
                ref: 'Quiz'
            }, choosenOptions: [String],
            quizTakenOn: {
                type: Date,
                required: [true, "Please provide a date on which quiz was taken!"]
            }
        }]
    }
});

const QuizList = mongoose.model('QuizList', quizListSchema);
module.exports = QuizList;