const env = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { connectToDatabase, getDb } = require("./db/db.js");
const express = require("express");

//router
const authRouter = require("./route/auth.route.js");
const userRouter = require("./route/user.route.js");
 const courseRouter=require("./route/question.route.js")

env.config();
const app = express();
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // Make sure this is placed early
app.options("*", cors(corsOptions)); // Preflight handler for all routes
//middleware
app.use(cookieParser());

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

//routes
app.use("/api", authRouter);
app.use("/api", userRouter);
app.use("/api", courseRouter);

const PORT = +process.env.PORT || 8000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
