const mongoose = require('mongoose');


const quizListSchema = new mongoose.Schema({
    quizes:{
        type: [{
            quiz: {
                type: mongoose.Schema.ObjectId,
                ref: 'Quiz'
            }, choosenOptions: [String], //would be empty for admin
            quizDate: { //will store taken or created date, depending on the user type
                type: Date,
                required: [true, "Please provide a date on which quiz was taken/created!"]
            }
        }]
    }
});

const QuizList = mongoose.model('QuizList', quizListSchema);
module.exports = QuizList;