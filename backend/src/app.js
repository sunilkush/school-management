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

// file import 
import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import booksRoutes from "./routes/book.routes.js";
import issuedBookRoutes from "./routes/issuedBooks.routes.js";
import studentRoutes from "./routes/student.routes.js";
import RoleRoutes from "./routes/role.routes.js";
import EmployeeRoutes from "./routes/employee.routes.js"

// route
app.use("/app/v1/school", schoolRoutes)
app.use("/app/v1/user", userRoutes)
app.use("/app/v1/class", classRoutes)
app.use("/app/v1/attendance", attendanceRoutes)
app.use("/app/v1/subject", subjectRoutes)
app.use("/app/v1/books", booksRoutes)
app.use("/api/v1/issuedBooks", issuedBookRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/role", RoleRoutes);
app.use("/api/v1/employee", EmployeeRoutes);

export { app }
