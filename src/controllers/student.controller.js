import { Student } from "../models/student.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const getAllStudents = asyncHandler(async (req, res) => {
    try {
        const students = await Student.find()
        .populate("user", "name email") // Populate user details
        .populate("class", "name") // Populate class details
        .populate("parent", "name email");
        return res.status(200).json(
            new ApiResponse(200, students, "Get all student successfully")
        )
    } catch (error) {
        throw new ApiError(404, error.message || "Student Not Found")
    }
})

const addStudent = asyncHandler(async (req, res) => {

    const {
        name,
        email,
        password,
        role,
        phone,
        rollNumber,
        classes,
        parentEmail,
        dateOfBirth,
        address,
        section } = req.body;

    if ([name,email,password,role,phone,rollNumber,parentEmail,dateOfBirth,address,section].some((filed) => filed?.trim() === "")) {
        throw new ApiError(400, 'All filed are Required !')
    }
    const existUser = await User.findOne({ email });

    if (existUser) {
      throw new ApiError(409, "User already registered");
    }
    try {
        const user = new User({
            name,
            email,
            password,
            role,
            phone
        })

        await user.save()
       //reate student record
       const student = new Student({
        user: user?._id,
        classes,
        section,
        rollNumber,
        parent: parentEmail ,
        address,
        dateOfBirth
       })

       await student.save()
        
       return res.status(200).json(
        new ApiResponse(201,{student,user}, "Student added successfully" )
       )

    } catch (error) {
        throw new ApiError(500, error.message || "")
    }

})

const getStudentById = asyncHandler(async(req,res)=>{
    const { id } = req.params;

    try {
        const student = await Student.findById(id)
      .populate("user", "name email")
      .populate("class", "name")
      .populate("parent", "name email");

    if (!student) {
       throw new ApiError(404,"student not found")
    }
     
    return res.status(200).json(
        new ApiResponse(201,student,"student find successfully ")
    )

    } catch (error) {
        throw new ApiError(500, error.message|| "somethis went error" )
    }

})


export {
    getAllStudents,
    addStudent,
    getStudentById
}