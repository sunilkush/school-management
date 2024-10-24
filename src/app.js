import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.ORIGIN_URI
}))

app.use(express.urlencoded({limit:"16kb",extended:true}));
app.use(express.static("public"))
app.use(express.json({limit:"16kb"}))
app.use(cookieParser())

export {app}