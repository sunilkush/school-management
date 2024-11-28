import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const requestToken = user.generateRequestToken()

    user.refreshToken = requestToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(404, "something went wrong while using access & request Token")
  }

}



const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, role, mobileNo } = req.body;

    // validation check all filed
    if ([username, email, password, role, mobileNo].some((filed) => filed?.trim() === "")) {
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
      mobileNo
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
    const { email, password, role } = req.body
    // validation
    if ([email, password, role].some((filed) => filed?.trim() === "")) {

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

export {
  registerUser,
  loginUser
};
