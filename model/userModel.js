const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");

//todo: add some validators too

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "A user must have a username"],
        unique: true,
        minLength: [5, "username too short(min=5)!"],
        maxLength: [15, "username too long(max=15)!"]
    }, email: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, "Email is must!"],
        validate: [validator.isEmail, "Please provide a valid email!"]
    }, name: {
        type: String,
        required: [true, "A user must have a username"],
        minLength: [5, "name too short(min=5)!"],
        maxLength: [15, "name too long(max=15)!"]
    }, password: {
        type: String, required: [true, "Please create a password!"], minlength: 8, select: false //do not select this ever
    }, passwordConfirm: {
        type: String, required: [true, "Please confirm the password!"], validate: {
            // This work on SAVE!!
            validator: function (el) {
                return el === this.password;
            }, message: "Passwords are not the same!"
        }
    }, passwordChangedAt: {
        type: Date
    }, passwordResetToken: String,
    passwordResetExpires: Number,
    active: Boolean, //todo: on delete, we simply set it to false, don't create JWT for this
    follows: [String],
    isAdmin: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;