import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // save refresh token in database
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // TODO:
  // 1. get data from req.body
  // 2. username or email
  // 3. find the user
  // 4. password check
  // 5. access and refresh token, generate and send to user
  // 6. send cookie

  // 1. get data from req.body
  const { username, email, password } = req.body;

  // 2. username or email
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  // 3. find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // 4. password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // 5. access and refresh token, generate and send to user
  // 6. send cookie
  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // remove this fields

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id); // req.user?._id -> this is taken from middleware
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword; // new password is saved using bcrypt values, from the method we wrote in middleware
  await user.save({ validateBeforeSave: false }); // no need of validations from Model

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path; // access to files available from middleware

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath); // upload on cloudinary

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password"); // new: true -> return the updated value

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path; // access to files available from middleware

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const cover = await uploadOnCloudinary(coverImageLocalPath); // upload on cloudinary

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password"); // new: true -> return the updated value

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
