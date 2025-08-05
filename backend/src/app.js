import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.ORIGIN_URI
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// file import 
import indexRouter from './routes/index.js';
import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import booksRoutes from "./routes/book.routes.js";
import issuedBookRoutes from "./routes/issuedBooks.routes.js";
import studentRoutes from "./routes/student.routes.js";
import RoleRoutes from "./routes/role.routes.js";
import EmployeeRoutes from "./routes/employee.routes.js";
import AcademicYearRoutes from "./routes/academicYear.routes.js";
import SectionRoutes from "./routes/section.routes.js";

// route
app.use('/', indexRouter);
app.use("/app/v1/school", schoolRoutes)
app.use("/app/v1/user", userRoutes)
app.use("/app/v1/class", classRoutes)
app.use("/app/v1/attendance", attendanceRoutes)
app.use("/app/v1/subject", subjectRoutes)
app.use("/app/v1/books", booksRoutes)
app.use("/app/v1/issuedBooks", issuedBookRoutes);
app.use("/app/v1/student", studentRoutes);
app.use("/app/v1/role", RoleRoutes);
app.use("/app/v1/employee", EmployeeRoutes);
app.use("/app/v1/academicYear", AcademicYearRoutes);
app.use("/app/v1/section", SectionRoutes);
export { app }
