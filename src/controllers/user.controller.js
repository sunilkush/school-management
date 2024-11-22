import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  try{
  const { username, email, password, role} = req.body;

  // validation check all filed
  if ([username, email, password, role ].some((filed) => filed?.trim() === "")) {
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
    role
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

export { registerUser };
