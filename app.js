const express = require("express");
const morgan = require("morgan"); //a middleware that logs requests onto the console
const app = express();
const rateLimit = require("express-rate-limit"); //will limit the number of login attempts
const helmet = require("helmet"); //adds additional HTTP headers
const mongoSanitize = require("express-mongo-sanitize"); //sanitize the mongo input
const xss = require("xss-clean"); //removes malicious code from input
const cors = require("cors"); //prevents cors blockage

// security HTTP headers
app.use(helmet());

const corsOpts = {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOpts));

//limit 10 login and signup attempts per hour per IP
const limiter = rateLimit({
    max: 10, windowMs: 60 * 60 * 1000, message: "Too many requests from this IP. Please try again later."
});
app.use('/users/login', limiter);
app.use('/users/signup', limiter);


// read data from the body into req.body, max is 10kb.
app.use(express.json({limit: "10kb"})); //data from body shall be added to req

//sanitize against non SQL code injection
app.use(mongoSanitize());

//sanitize against xss
//will convert html symbols to,for example < to &lt;
app.use(xss());

//adding the request time to req object
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

//development dependency, logs the recent request in the console
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

//defining routers
const userRouter = require("./routes/userRoutes.js");
const quizRouter = require("./routes/quizRouter");
const lessonsRouter = require("./routes/lessonsRouter");
const newsRouter = require("./routes/newsRouter");

app.get("/", (req, res, next) => {
    res.status(200).json({
        status: "success", message: "Welcome to Space Odyssey server!",
    });
});

app.use("/users", userRouter);
app.use("/quiz", quizRouter);
app.use("/lessons", lessonsRouter);
app.use("/news", newsRouter);

//for undefined routs
const AppError = require("./util/appError");
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on spaceOdyssey server!`, 404));
});

//in case of operational error this middleware function will be called to return relevant error message
const globalErrorController = require("./controllers/errorController");
app.use(globalErrorController);

module.exports = app;
