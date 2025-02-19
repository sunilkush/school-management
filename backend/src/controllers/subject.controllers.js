import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subject } from "../models/subject.model.js";

//Create a Subject (POST)

const createSubject = asyncHandler(async()=>{
    const {schoolId, name, teacherId, classes} = req.body;

    if([schoolId, name, teacherId, classes].some((fields)=>fields?.trim()==="")){
         throw new ApiError(400,"All required fields must be provided.")
    }

    const subject = new Subject({
        schoolId, 
        name, 
        teacherId, 
        classes
    });
    
    const saveSubject = await subject.save();

    if(!saveSubject){
        throw new ApiError(400,"subject not created !")
    } 

    return res.status(201).json(
        new ApiResponse(200,saveSubject,"subject created Successfully !")
    )



})

//Get All Subjects (GET)
 
const getAllSubjects = asyncHandler(async(req,res)=>{
    try {
        const subjects = await Subject.find()
    .populate("schoolId", "name")  // Populate School Name
    .populate("teacherId", "name email")  // Populate Teacher Details
    .populate("classes", "name"); // Populate Class Names

    if(!subjects){
        throw new ApiError(400,"subject not found !")
    }

    return res.status(200).json(
        new ApiResponse(200,subjects,"Subject successfully !")
    )
    } catch (error) {
        throw new ApiError(500, error.message || "something went wrong !")
    }
})

//Get Subject by ID (GET)
const getSubject = asyncHandler(async(req,res)=>{
      try {
        const {id} = req.params
      const subject = await Subject.findById(id)
      .populate("schoolId", "name")
      .populate("teacherId", "name email")
      .populate("classes", "name");

      if(!subject){
        throw new ApiError(404,"Subject not found")
      }

      return res.status(200).json(
        new ApiResponse(200,subject,"Subject find successfully !")
      )
      } catch (error) {
        throw new ApiError(500, error.message || "something went wrong !")
      }

})
//Update Subject (PUT)
const updateSubject = asyncHandler(async(req,res)=>{
    try {
        const {subjectId} = req.params
        const { name, teacherId, classes } = req.body;

        const updatedSubject = await Subject.findByIdAndUpdate(
            subjectId,
            { name, teacherId, classes },
            { new: true } // Return updated document
        );
       
        if(!updatedSubject){

        }
        return res.status(200).json(
            new ApiResponse(200,updatedSubject,"subject updated successfully ! ")
        )
    } catch (error) {
        throw new ApiError(500,error.message || "Something Went Worng !")
    }
})
//Delete Subject (DELETE)

const deleteSubject = asyncHandler(async(req,res)=>{
     try {
        const {subjectId }= req.params
        const deletedSubject = await Subject.findByIdAndDelete(subjectId);

        if (!deletedSubject) {
            throw new ApiError(404,"Not Found Subject !")
        };
        return res.status(200).json(
            new ApiResponse(200,"subject deleted successfully ! ")
        )
     } catch (error) {
        throw new ApiError(500,error.message || "Something Went Worng !")
     }
})

export {
    createSubject,
    getAllSubjects,
    getSubject,
    updateSubject,
    deleteSubject
}