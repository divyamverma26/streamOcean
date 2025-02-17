import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAvatar,
    getUserProfile,
    getUserHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changePassword);
router
    .route("/update-avatar")
    .patch(verifyJwt, upload.single("avatar"), updateAvatar);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/channel/:username").get(verifyJwt, getUserProfile);
router.route("/history").get(verifyJwt, getUserHistory);

export default router;
