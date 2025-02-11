import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.ORIGIN_URI
}))

app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"))
app.use(express.json({ limit: "16kb" }))
app.use(cookieParser())

import schoolRoutes from "./routes/school.routes.js";
//import userRoutes from "./routes/user.routes.js";
//import studentRoutes from "./routes/student.routes.js";

app.use("/app/v1/school", schoolRoutes)
//app.use("/app/v1/user", userRoutes)
//app.use("/app/v1/student", studentRoutes)


export { app }
