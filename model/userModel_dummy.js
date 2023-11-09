const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String, required: [true, "Please input a name!"],
    }, email: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, "Email is must!"],
        validate: [validator.isEmail, "Please provide a valid email!"]
    }, photo: {
        type: String
    }, role: {
        type: String, enum: {
            values: ['user', 'guide', 'lead-guide', 'admin'],
            message: "A user must be 'user', 'guide', 'lead-guide' or 'admin'."
        }, default: 'user'
    }, password: {
        type: String, required: [true, "Please create a password!"], minlength: 8, select: false
    }, passwordConfirm: {
        type: String, required: [true, "Please confirm the password!"], validate: {
            // This work on SAVE!!
            validator: function (el) {
                return el === this.password;
            }, message: "Passwords are not the same!"
        }
    }, passwordChangedAt: {
        type: Date
    }, passwordResetToken: String, passwordResetExpires: Number, active: Boolean
}, {
    toJSON: {virtuals: true}, toObject: {virtuals: true}
});


userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcryptjs.compare(candidatePassword, userPassword);
}

userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
    console.log(JWTTimeStamp);

    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(`${this.passwordChangedAt.getTime() / 1000}`, 10);
        console.log(changedTimestamp);
        console.log("exiting changePasswordAfter");
        return JWTTimeStamp < changedTimestamp;
    }
    console.log("passwordChangedAt not set.")
    console.log("exiting changePasswordAfter");
    return false;
}


userSchema.pre('save', async function (next) {
    console.log("pre save 1 started");
    // console.log("Save:")
    // console.log(this)
    if (!(this.isModified('password'))) return next();

    //encrypt the password
    this.password = await bcryptjs.hash(this.password, 12);
    this.passwordConfirm = undefined; //don't save this in the database, there won't be any field for passwordConfirm
    console.log("pre save 1 ended");
    next();
});

//save only if password is changed and is new :)
userSchema.pre('save', function (next) {
    console.log("pre save 2 started");
    if (!this.isModified('password') || this.isNew) return next();
    //sometimes saving to database is slow
    // , so ... decreasing 10 second so it not to create any problem while loging in using token
    this.passwordChangedAt = Date.now() - 10000;
    console.log("pre save 2 ended");
    next();
});

userSchema.pre(/^find/, function (next) {
    //this points to current query
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.createPasswordResetToken = function () {

    //we cant simply store resetToken as it is into the database due to security issues
    const resetToken = crypto.randomBytes(32).toString('hex');
    //the following two will be stored instead
    //the next line will update the resetToken
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + (10 * 60 * 100); //valid for 10 minutes
    //we have not updated this user document yet, that will be done in the resetPassword function
    //that is supposed to call createPasswordToken

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
