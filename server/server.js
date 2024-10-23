import express from "express";
const app = express();
import "express-async-errors";

import dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT || 5000;


// ------------cors------------ //
import cors from 'cors';

const allowedOrigins = [
  'https://job-track-02.vercel.app',  // Your main frontend deployment
  'https://job-track-02-dbba8rox0-somas-projects-4e1e316d.vercel.app'  // Any staging/development URLs
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the request's origin is in the allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow credentials (cookies, authentication)
};

app.use(cors(corsOptions));









// ------------DB & AuthenticateUser------------ //
import connectDB from "./db/connect.js";
import morgan from "morgan";

// ------------Routers------------ //
import authRouter from "./routes/authRoutes.js";
import jobsRouter from "./routes/jobsRouter.js";

// ------------middleware------------ //
import notFoundMiddleware from "./middlewares/not-found.js";
import errorHandlerMiddleware from "./middlewares/error-handler.js";
import authenticateUser from "./middlewares/auth.js";

// ------------Security Packages------------ //
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// ------------Production------------ //
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

// -------------------------------------------------------------- //

const __dirname = dirname(fileURLToPath(import.meta.url)); // because we're using ES6-modules not common.js

app.use(express.static(path.resolve(__dirname, "../client/build"))); // static assets

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json()); // make json-data available
app.use(helmet()); // secure Express-app by setting various HTTP headers
app.use(xss()); // node-Connect-middleware to sanitize user input coming from POST body, GET queries, and url params
app.use(mongoSanitize()); // Sanitizes user-supplied data to prevent MongoDB Operator Injection

app.get("/api/v1", (req, res) => {
  res.json("Welcome!");
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

// direct to index.html for react-router after the 2 routes above
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);

    // only connect to server if successfully-connected to DB
    app.listen(port, () =>
      console.log(`Server is listening on http://localhost:${port}`)
    );
  } catch (error) {
    console.log(error);
  }
};
start();
