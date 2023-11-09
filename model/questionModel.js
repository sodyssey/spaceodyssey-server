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
    } , correctOption : {
        type: String,
        validate:{
            validator: function (opt) {
                
            }
        }
    }

});