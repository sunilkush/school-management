import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Student } from "../models/student.models.js"
import { Staff } from "../models/staff.models.js"

const registerUser = asyncHandler(async (req, res) => {
   
        const { email, password, role, fullName,dateOfBirth,phoneNo  } = req.body
         console.log(req.body)
      
        if ([email, password, role, fullName,dateOfBirth].some((filed) => filed?.trim() === "")) {
            throw new ApiError(400, 'All filed are Required !')
          }
        const existedUser = await User.findOne({ email });

        if (existedUser) {
            throw new ApiError(409, "User Already exists")
        }
           

        // Create profile for student/teacher/admin based on role
            let profile;
            if (role === 'student') {
            profile = new Student({ fullName, dateOfBirth, phoneNo });
            } else if (role === 'teacher') {
            profile = new Staff({ fullName, dateOfBirth, phoneNo });
            } else if (role === 'admin') {
            profile = new Staff({ fullName, dateOfBirth, phoneNo });
            }       

            await profile.save(); // Save profile to database
          
           const user = await User.create({
               fullName,
               password,
               email,
               role,
               profileId: profile._id
           })
        
         
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500,"Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApiResponse(200,createdUser,"User Registered successfully")
        )

})



export {
    registerUser
}
