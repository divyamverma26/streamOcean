import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";

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

export { registerUser };
