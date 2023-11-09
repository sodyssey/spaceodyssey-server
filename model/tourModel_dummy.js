const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "A tour must have a name!"],
        unique: true,
        maxlength: [40, "A tour must have less than or equals to 40 characters!"],
        minlength: [10, "A tour must have more than or equals to 10 characters!"], // validate: [validator.isAlpha, "Tour name must contain only AlphaNumeric characters"]
    }, slug: {
        type: String
    }, duration: {
        type: Number, required: [true, "A tour must have a duration!"]
    }, maxGroupSize: {
        type: Number, required: [true, "A tour must have a group size!"]
    }, difficulty: {
        type: String, required: [true, "A tour must have a difficulty level"], enum: {
            values: ['easy', 'medium', 'difficult'], message: "Invalid difficulty"
        }
    }, ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be greater than or equals to 1.0"],
        max: [5, "Rating must be smaller than or equals to 5.0"]
    }, ratingsQuantity: {
        type: Number, default: 0, min: 0
    }, price: {
        type: Number, required: [true, "A tour must have a price"]
    }, discount: {
        type: Number, validate: [function (val) {
            return val < this.price;
        }, "Discount price ({VALUE}) must be less than the actual price"]
    }, summary: {
        type: String, trim: true, required: [true, "A tour must have a summary"]
    }, description: {
        type: String, trim: true
    }, imageCover: {
        type: String, required: [true, "A tour must have a Cover image"]
    }, images: [String], createdAt: {
        type: Date, default: Date.now()
    }, startDates: [Date], secretTour: {
        type: Boolean, default: false
    }, //embeded modeling
    startLocation: {
        //GeoJson: it is necessary to have the following fields to make it GeoJson
        type: {
            type: String, default: 'Point', //must
            enum: ['Point'] //we only want it to be point due to some reasons
        }, coordinates: [Number], //longitude and latitude, we usually have the reverse of it
        address: String, description: String
    }, locations: [{
        type: {
            type: String, default: 'Point', enum: ['Point']
        }, coordinates: [Number], address: String, description: String, day: Number
    }], guides: {
        type: mongoose.Schema.ObjectId, ref: 'User' //no need to even import User to do this, ok '>'
    }
}, {
    toJSON: {virtuals: true}, toObject: {virtuals: true}
});

//document middleware to call before .save and .crate
tourSchema.pre('save', function (next) {
    //this points at the current document
    this.slug = slugify(this.name, {lower: true});
    next();
});

// Querry middleware
tourSchema.pre(/^find/, function (next) {
    //this points to the current query
    //hide secret tours
    this.find({secretTour: {$ne: true}});
    this.start = Date.now();
    next();
});


tourSchema.pre(/^find/, function () {
    //this points to the current query
    this.populate(
        {
            path: 'guides', //guides are normalized
            select: '-__v -passwordChangedAt' //hiding these fields from the guides
        });
});

tourSchema.post(/^find/, function () {
    //this points to the current query
    console.log(`Querry took ${Date.now() - this.start} milliseconds!`)
});


tourSchema.pre("aggregate", function (next) {
    this.pipeline().unshift({$match: {secretTour: {$ne: true}}}) //add to beginning of the array
    console.log(this.pipeline());
    next();
});

//callback need to be a regular function and not an arrow function as arrow don't have 'this'
tourSchema.virtual('durationWeeks').get(function (duration) {
    return this.duration / 7;
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
