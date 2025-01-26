import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// MAIN URL: https://localhost:8000/api/v1/users/register, any route after "/user" will be sent in this controller

const registerUser = asyncHandler(async (req, res) => {
  /*
  Things to do here:
  1. get user details from frontend
  2. validation - not empty
  3. check if user already exists: username, email
  4. check all required fields defined in user.model (images, avatar)
  5. if image and avatar are there in request, then upload them to cloudinary, and get the url to save that string in database
  6. create user object - create entry in db
  7. remove password and refresh token field from response
  8. check for user creation
  9. if yes, then return response
  */

  // 1. get user details from frontend
  const { username, email, fullName, password } = req.body;

  // 2. validation - not empty
  // one way to validate
  //   if (fullName === "") {
  //     throw new ApiError(400, "Full name is required"); // this is used from Utils
  //   }

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. check if user already exists: username, email
  // Here basically "username | email" something is written
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // 4. check all required fields defined in user.model (images, avatar)
  // we get access to req.files because of multer, as it is a middleware
  // req.files will have such data:
  /*
  {
    "avatar": [
      {
        "fieldname": "avatar",
        "originalname": "profile.jpg",
        "encoding": "7bit",
        "mimetype": "image/jpeg",
        "destination": "uploads/",
        "filename": "12345-profile.jpg",
        "path": "uploads/12345-profile.jpg",
        "size": 102400
      }
    ],
    "coverImage": [
      {
        "fieldname": "coverImage",
        "originalname": "cover.jpg",
        "encoding": "7bit",
        "mimetype": "image/jpeg",
        "destination": "uploads/",
        "filename": "54321-cover.jpg",
        "path": "uploads/54321-cover.jpg",
        "size": 204800
      }
    ]
  }
  */
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 5. if image and avatar are there in request, then upload them to cloudinary, and get the url to save that string in database
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar file to cloudinary");
  }

  // 6. create user object - create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", // as this coverImage is not mandatory, so put "" in db
    password,
  });

  // 7. remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8. check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 9. if yes, then return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});

export { registerUser };
