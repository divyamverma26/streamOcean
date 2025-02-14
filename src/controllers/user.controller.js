import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";
import { generateTokens } from "../utils/tokens.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    //validation using "some" array method of js
    if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //check if username or email is already in use
    const existed = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existed) {
        throw new ApiError(409, "User already existed");
    }

    //check for availability of images: multer provides this function to req
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    //upload on cloud
    const avatar = await uploadFile(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadFile(coverImageLocalPath)
        : { url: "" };
    if (!avatar) throw new ApiError(400, "Avatar is required");

    //create user object
    const userObject = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username: username.toLowerCase(),
    });

    //check if user is created and also remove password from response
    const createdUser = await User.findById(userObject._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) throw new ApiError(500, "User registration failed!!");

    //sending response
    return res
        .status(200)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }
    const userFound = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!userFound) {
        throw new ApiError(404, "User does not exist");
    }

    const isCorrect = await userFound.checkPassword(password);

    if (!isCorrect) {
        throw new ApiError(401, "Incorrect Password");
    }

    const { refreshToken, accessToken } = await generateTokens(userFound._id);

    const loggedUser = await User.findById(userFound._id).select(
        "-password -refreshToken"
    );

    //send logged user in cookies, create option for cookies setup
    const options = {
        // now only server can modify our cookies
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
                {
                    user: loggedUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        { new: true }
    );
    const options = {
        // now only server can modify our cookies
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedUser = jwt.verify(
            incomingRefreshToken,
            REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedUser?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } = await generateTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access Token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
