import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(404, "something went wrong while using access & request Token")
  }

}



const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, role, phone } = req.body;

    // validation check all filed
    if ([username, email, password, role, phone].some((filed) => filed?.trim() === "")) {
      throw new ApiError(400, 'All filed are Required !')
    }

    const existUser = await User.findOne({ email });

    if (existUser) {
      throw new ApiError(409, "User already registered");
    }

    const user = new User({
      username,
      email,
      password,
      role,
      phone
    });
    await user.save()

    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully")
    )
  }
  catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    // get data by frontend
    const { email, password} = req.body
    // validation
    if ([email, password].some((filed) => filed?.trim() === "")) {

      throw new ApiError(401, "all filed required !")
    }
    //find the user
    const user = await User.findOne({ email })

    if (!user) {
      throw new ApiError(404, "user not found")
    }
    // password check
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid User")
    }
    // generate token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // cookies send  & response
    const options = {
      secure: true,
      httpOnly: true
    }

    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(201, {
          user: loggedInUser, refreshToken, accessToken,
        }, "user successfully logged in")
      )
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})


const logoutUser = asyncHandler(async (req, res) => {
  try {
    // get user by auth
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        refreshToken: 1
      }
    }, { new: true })
  
    const options = {
      secure:true,
      httpOnly:true
    }
  // response send
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(201,{},"User Logged out"))
  } catch (error) {
     throw new ApiError(500,error.message || "User Not Found !")
  }
 
})
// refreshAccessToken
const refreshAccessToken = asyncHandler(async(req,res)=>{
  // find refresh token 
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorized request")
   }

   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REQUEST_TOKEN_SECRET)

   const user = await User.findById(decodedToken?._id);


});
// update user
const updateUser = asyncHandler(async(req,res)=>{

});
// delete User
const deleteUser = asyncHandler(async(req,res)=>{

});
// view User
const viewUsers = asyncHandler(async(req,res)=>{

});
// Reset Password
const resetPassword = asyncHandler(async(req,res)=>{

});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  viewUsers,
  resetPassword
};
