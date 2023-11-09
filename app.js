const path = require("path");
const express = require("express");
const morgan = require("morgan"); //a middleware that logs requests onto the console
const app = express();
const rateLimit = require("express-rate-limit"); //will limit the number of login attempts
const helmet = require("helmet"); //input safety
const mongoSanitize = require("express-mongo-sanitize"); //input safety
const xss = require("xss-clean"); //input safety
const hpp = require("hpp"); //input safety

//Global Middlewares

//todo: check if limit is a good idea!
//might need to disable this as our app require a lot of api requests
//limit 100 api access requests per hour
// const limiter = rateLimit({
//   max: 100, windowMs: 60 * 60 * 1000, message: "Too many requests from this IP. Please try again later."
// });
//limit api access
// app.use('/api', limiter);

//security HTTP headers
// app.use(helmet());

// read data from the body into req.body, max is 10kb.
app.use(express.json({limit: '10kb'})); //data from body shall be added to req

//sanitize against non SQL code injection
// app.use(mongoSanitize());

//sanitize against xss
//will convert html symbols to,for example < to &lt;
// app.use(xss());

//todo: preventing parameter pollution
//suppose we have .../.../...?sort=price&sort=difficulty then in this will be converted to
// array by mongoose [price, duration]. and our Sort() function from apiFeatures wont work. using hpp only last one
// that is 'difficuty' will be returned by mongoose and that too as a string.
// for some parameters, for example .../...?duration=5&duration=9 we would like to have a array
// app.use(hpp({
//   whitelist: [
//   ]
// }));

//adding the request time to req object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

//development dependency, logs the recent request in the console
if (process.env.NODE_ENV === 'development') app.use(morgan('dev')); //only log api calls to the console when in development mode!


//todo: inplement protected feature for routs: create question, quiz are allowed to admin only
const userRouter = require("./routes/userRoutes.js");
const questionRouter = require("./routes/questionRoutes");
app.use('/user', userRouter);
app.use('/question',questionRouter);

//for undefined routs
const AppError = require('./util/appError');
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server! and its spaceOdyssey`, 404));
});

//in case of operational error this middleware function will be called
const globalErrorController = require('./controllers/errorController');
app.use(globalErrorController);

module.exports = app;