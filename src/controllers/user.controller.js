import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

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
    const { name,username, email, password, role, phone } = req.body;

    // validation check all filed
    if ([name,username, email, password, role, phone].some((filed) => filed?.trim() === "")) {
      throw new ApiError(400, 'All filed are Required !')
    }

    const existUser = await User.findOne({ email });

    if (existUser) {
      throw new ApiError(409, "User already registered");
    }

    const user = new User({
      name,
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
      secure: true,
      httpOnly: true
    }
    // response send
    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(201, {}, "User Logged out"))
  } catch (error) {
    throw new ApiError(500, error.message || "User Not Found !")
  }

})
// refreshAccessToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  // find refresh token 
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  // check incoming token
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }

  try {
    // verify token 
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    // find user
    const user = await User.findById(decodedToken?._id);
    // check user
    if (!user) {
      throw new ApiError(401, " Invalid refresh Token")
    }
   
    // incoming token check 
    if (!incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired and used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }
    // generateAccessandRefreshToken 
    const { newRefreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)
    // return response
    return res.status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(200, {
        refreshToken: newRefreshToken,
        accessToken
      },
        "Request token refreshed"
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
});
// update user
const updateUser = asyncHandler(async (req, res) => {

  try {
    const { email, phone } = req.body

    if (!email || !phone) {
      throw new ApiError(400, "All fields are required please set")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
      $set: {
        email,
        phone
      }
    },
      {
        new: true
      }).select("-password")

    return res.status(200)
      .json(
        new ApiResponse(200, user, "Account Details update successfully")
      )
  } catch (error) {
    throw new ApiError(401, error?.message)
  }

});
// delete User
const deleteUser = asyncHandler(async (req, res) => {
    try { 
      const user = await User.findById(req.user?._id).select("-password")
      user.isActive = false
      await user.save({validateBeforeSave:false})
      
    return  res.status(200)
    .json(
      new ApiResponse(200,user,"User Deactive Successfully !")
    )
    } catch (error) {
      throw new ApiError(401, error?.message)
    }
});
// view User
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res.status(200).json(
      new ApiResponse(200, req.user, "user fatch successfully !")
    )
  } catch (error) {
    throw new ApiError(401, error?.message)
  }
});
// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    try {
      const {oldPassword,newPassword} = req.body
      if(!(oldPassword || newPassword)){
        throw new ApiError(400, "filed empty old password and new password")
      }
       const user = await User.findById(req.user?._id)

       const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

       if (!isPasswordCorrect) {
        throw new ApiError(400, "Old Password invalid")
      }
    
      user.password = newPassword
      await user.save({ validateBeforeSave: false })
    
      return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
    } catch (error) {
      throw new ApiError(401, error?.message)
    }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  resetPassword,
  refreshAccessToken
}
