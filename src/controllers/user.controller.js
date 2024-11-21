import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role,mobileNo } = req.body;

  if ([username, email, password, role,mobileNo].some((filed) => filed?.trim() === "")) {
    throw new ApiError(400, 'All filed are Required !')
  }
  console.log("hello")
  const existUser = await User.findOne({ email });

  if (existUser) {
    throw new ApiError(409, "User already registered");
  }

  const user = await User.create({
    username,
    email,
    password,
    role,
    mobileNo
  });

  const createdUser = await User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

export { registerUser };
