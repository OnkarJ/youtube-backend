import { asyncHandler } from "../utils/asyncHandler.js";

// MAIN URL: https://localhost:8000/api/v1/users/register, any route after "/user" will be sent in this controller

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "OK" }); // no need of return here, as "asyncHandler" gives a return as it is a wrapper
});

export { registerUser };
