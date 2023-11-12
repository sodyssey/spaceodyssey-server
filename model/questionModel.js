const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionString: {
        type: String,
        required: [true, "There must be a question!"],
        minLength: 10
    }, options: {
        type: [String],
        required: [true, "Please provide some options!"],
        minLength: 4
    }, correctOption: {
        type: String,
        lowercase: true,
        validate: {
            validator: function (val) {
                const asciiVal = val.toLowerCase().charCodeAt(0);
                const max = (96 + this.options.length);
                return asciiVal >= 97 && asciiVal <= max;
            },
            message: "There is no such option!"
        }
    }
});

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;