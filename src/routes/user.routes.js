import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // upload is a middleware here
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
// post will go to verifyJWT as per it is the first handler, but in that method, once it is completed "next()" will help to tell to move to next handler that is logoutUser
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    user: req.user,
  });
});
router.route("/update-account").patch(verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Account details updated successfully",
  });
});
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), (req, res) => {
    res.status(200).json({
      success: true,
      message: "Avatar image updated successfully",
    });
  });
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), (req, res) => {
    res.status(200).json({
      success: true,
      message: "Cover image updated successfully",
    });
  });
router.route("/c/:username").get(verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User channel fetched successfully",
  });
});
router.route("/history").get(verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Watch history fetched successfully",
  });
});
router.route("/:userId").get(verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
  });
});

export default router;
