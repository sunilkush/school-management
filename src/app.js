import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.ORIGIN_URI
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";

app.use("/app/v1/school", schoolRoutes)
app.use("/app/v1/user", userRoutes)
app.use("/app/v1/class", classRoutes)


export { app }
