import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import role from "../middlewares/role.js";
import ForgotPasswordOTP from "../models/forgotPasswordOTP.model.js";
import UserOTPVerification from "../models/userOTPVerification.model.js";
import { User } from "../models/user.model.js";
import { AuthFailureError, BadRequestError } from "../core/error.response.js";
import { encrypt } from "../configs/encryption.config.js";
import Conversation from "../models/conversation.model.js";
import Notification from "../models/notification.model.js";
import {
    allocateUniqueDomainName,
    generateToken,
} from "../utils/token.util.js";
import { sendOtpEmail } from "../configs/brevo.config.js";

class AuthService {
    static login = async ({ email, password, timeZone }) => {
        // 1. Check user and Blacklist
        const user = await User.findOne({ email });
        if (!user) throw new BadRequestError("User not found");
        // 2. Login validation
        // const match = await bcrypt.compare(password, user.password)
        // if (!match) throw new AuthFailureError('Account or password is invalid')
        if (password !== user.password)
            throw new AuthFailureError("Account or password is invalid");

        let token = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
        );
        token = encrypt(token);
        user.accessToken = token;
        user.activity.lastVisit = new Date();
        await user.save();

        // 3. Check unseen conversations
        // const userId = user._id

        // const [filteredUnSeenConversations, unSeenNotifications] = await Promise.all([
        //     Conversation.find({
        //         members: { $elemMatch: { user: userId } },
        //         'messages.0': { $exists: true },
        //     })
        //         .select('members messages')
        //         .populate('members.user', 'avatar fullName domainName')
        //         .populate('messages.senderId', 'avatar fullName domainName')
        //         .lean()
        //         .then((conversations) =>
        //             conversations.filter((conv) => {
        //                 const last = conv.messages?.[conv.messages.length - 1]
        //                 if (!last) return false

        //                 // normalize ids
        //                 const senderId = last.senderId && last.senderId._id ? last.senderId._id.toString() : last.senderId?.toString()

        //                 const seenBy = (last.seenBy || []).map((id) => id.toString())
        //                 const me = userId.toString()

        //                 // unseen if: last msg not by me AND I am not in seenBy
        //                 return senderId !== me && !seenBy.includes(me)
        //             })
        //         ),

        //     // Notifications
        //     Notification.find({
        //         receiverId: new mongoose.Types.ObjectId(userId),
        //         isSeen: false,
        //     }).lean(),
        // ])
        // delete userData.pinCode

        // userData.unSeenConversations = filteredUnSeenConversations
        // userData.unSeenNotifications = unSeenNotifications

        return {
            code: 200,
            metadata: {
                user,
            },
        };
    };

    static signUp = async ({ fullName, email, password, clinicians }) => {
        // 1️⃣ Normalize inputs
        fullName = String(fullName || "").trim();
        email = String(email || "")
            .trim()
            .toLowerCase();
        password = String(password || "").trim();
        clinicians = String(clinicians || "").trim();

        // // 2️⃣ Hash password
        // const passwordHash = await bcrypt.hash(password, 10)

        // 3️⃣ Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // 4️⃣ Upsert OTP record (SIMPLE & SAFE)
        try {
            await UserOTPVerification.findOneAndUpdate(
                { email },
                {
                    fullName,
                    email,
                    password,
                    clinicians,
                    otp,
                    expiredAt,
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                },
            );
        } catch (err) {
            console.error("OTP upsert error:", err);
            throw new BadRequestError("Cannot create verification record");
        }

        // 5️⃣ Send OTP email
        try {
            await sendOtpEmail(
                email,
                "[SoulEase] OTP for Account Registration",
                "Your verification code to complete account registration is:",
                otp,
            );
        } catch (err) {
            console.error("OTP email error:", err);
            throw new BadRequestError("Failed to send verification email");
        }

        // 6️⃣ Done
        return {
            code: 201,
            metadata: { email },
        };
    };

    static verifyOtp = async ({ email, otp }) => {
        // 1. Find the OTP in the database
        const otpRecord = await UserOTPVerification.findOne({ email }).lean();

        // 2. Check if the OTP is correct
        if (!otpRecord || otpRecord.otp !== otp) {
            throw new BadRequestError("Invalid OTP code");
        }

        // 3. Check if the OTP is expired
        if (otpRecord.expiredAt < new Date()) {
            throw new BadRequestError("OTP code has expired");
        }

        // 4. Create user by otpVerification
        // 4.1 Use util to create unique domainName
        const domainNameUnique = await allocateUniqueDomainName(
            otpRecord.fullName,
            (probe) => User.exists({ domainName: probe }), // pass probe checker
        );

        // 4.2 Create user
        const newUser = new User({
            fullName: otpRecord.fullName,
            email: otpRecord.email,
            password: otpRecord.password,
            domainName: domainNameUnique,
            role: "clinic",
        });

        await newUser.save();

        // 7. Delete the OTP record
        await UserOTPVerification.deleteOne({ email });

        // 8. Create encrypted JWT token
        let token = generateToken(newUser); // ✅ use util
        token = encrypt(token);

        newUser.accessToken = token;
        await newUser.save();

        const { password, ...userWithoutPassword } = newUser.toObject();
        return {
            code: 200,
            metadata: {
                user: userWithoutPassword,
            },
        };
    };

    static forgotPassword = async ({ email }) => {
        // 1. Find the user by email
        const user = await User.findOne({ email }).select("email").lean();
        if (!user) throw new BadRequestError("Account has not been registered");

        const oldOtp = await ForgotPasswordOTP.findOne({ email }).lean();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the start of the day

        let otp;
        if (oldOtp) {
            const lastRequestDate = new Date(oldOtp.lastRequestDate);
            lastRequestDate.setHours(0, 0, 0, 0); // Set to the start of the day

            if (lastRequestDate.getTime() === today.getTime()) {
                // Same day request
                if (oldOtp.requestCount >= 10) {
                    throw new BadRequestError(
                        "You have exceeded the maximum number of requests for today. Please try again tomorrow.",
                    );
                } else {
                    // Increment request count and generate new OTP
                    otp = crypto.randomInt(100000, 999999).toString();
                    await ForgotPasswordOTP.updateOne(
                        { email },
                        {
                            $inc: { requestCount: 1 },
                            $set: {
                                otp,
                                expiredAt: new Date(
                                    Date.now() + 30 * 60 * 1000,
                                ),
                                lastRequestDate: new Date(),
                            },
                        },
                    );
                }
            } else {
                // Different day request, reset count and generate new OTP
                otp = crypto.randomInt(100000, 999999).toString();
                await ForgotPasswordOTP.updateOne(
                    { email },
                    {
                        $set: {
                            requestCount: 1,
                            lastRequestDate: new Date(),
                            otp,
                            expiredAt: new Date(Date.now() + 30 * 60 * 1000),
                        },
                    },
                );
            }
        } else {
            // New OTP request
            otp = crypto.randomInt(100000, 999999).toString();
            const forgotPasswordOTP = new ForgotPasswordOTP({
                email,
                otp,
                expiredAt: new Date(Date.now() + 30 * 60 * 1000), // OTP expires in 30 minutes
                requestCount: 1,
                lastRequestDate: new Date(),
            });
            await forgotPasswordOTP.save();
        }

        // 3. Send OTP email
        try {
            const subject = `[SoulEase] OTP for Password Change`;
            const message = `Your verification code to change your password is:`;
            const verificationCode = otp;

            await sendOtpEmail(email, subject, message, verificationCode);
        } catch (error) {
            console.error(error);
            throw new BadRequestError("Failed to send verification email");
        }

        return {
            code: 200,
            metadata: {
                email,
            },
        };
    };

    static verifyResetPasswordOtp = async ({ email, otp }) => {
        //1. Find, check the OTP and user in the database
        const otpRecord = await ForgotPasswordOTP.findOne({ email });

        // 2. Check if the OTP is correct
        if (!otpRecord || otpRecord.otp !== otp) {
            throw new BadRequestError("Invalid OTP code");
        }
        if (otpRecord.expiredAt < new Date())
            throw new BadRequestError("OTP code has expired");

        //3. Mark the otp is verified
        otpRecord.isVerified = true;
        otpRecord.save();

        return {
            message: "OTP verified successfully",
        };
    };

    static resetPassword = async ({ email, password }) => {
        //1. Find and check the OTP and user in the database
        const otpRecord = await ForgotPasswordOTP.findOne({ email });
        const user = await User.findOne({ email }).select("email password");

        // 2. Check if the OTP is correct
        if (!otpRecord) throw new BadRequestError("Invalid OTP code");

        if (otpRecord.expiredAt < new Date())
            throw new BadRequestError("OTP code has expired");

        if (!user) throw new BadRequestError("Account has not been registered");

        //2. Check if the OTP is verified
        if (!otpRecord.isVerified)
            throw new BadRequestError("OTP has not been verified");

        //3. Hash the new password
        if (!password) throw new BadRequestError("Invalid password");
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        await user.save();

        //4. Delete the OTP record
        await ForgotPasswordOTP.deleteOne({ email });

        return {
            message: "Password reset successfully",
        };
    };

    static grantAccess(action, resource) {
        return async (req, res, next) => {
            try {
                const userInfo = await User.findById(req.userId)
                    .select("role")
                    .lean();
                const userRole = userInfo.role;
                const permission = role.can(userRole)[action](resource);
                if (!permission.granted) {
                    return res.status(401).json({
                        error: "You are not authorized to perform this action",
                    });
                }
                next();
            } catch (error) {
                next(error);
            }
        };
    }

    //Mobile
    static loginMobile = async ({ email, password }) => {
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) throw new BadRequestError("Account has not been registered");

        // 2. Compare password
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            throw new AuthFailureError("Account or password is invalid");

        // 3. Generate JWT and encrypt
        let token = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }, // ✅ token expiration
        );
        token = encrypt(token);

        // ✅ Store accessToken in DB
        user.accessToken = token;
        await user.save();

        const userId = user._id;
        let hasSetPinCode = !!user.pinCode;

        // 4. Fetch unseen conversations
        const unSeenConversations = await Conversation.find({
            members: { $elemMatch: { user: userId } },
        })
            .populate("members.user messages.senderId")
            .lean();

        const filteredUnSeenConversations = unSeenConversations.filter(
            (conversation) => {
                const last =
                    conversation.messages?.[conversation.messages.length - 1];
                if (!last) return false;

                const senderId =
                    last.senderId && last.senderId._id
                        ? last.senderId._id.toString()
                        : last.senderId?.toString();

                const seenBy = (last.seenBy || []).map((id) => id.toString());
                const me = userId.toString();

                return senderId !== me && !seenBy.includes(me);
            },
        );

        // 5. Fetch unseen notifications
        const unSeenNotifications = await Notification.find({
            receiverId: userId,
            isSeen: false,
        });

        // Convert user to plain object and remove sensitive info
        const userData = user.toObject();
        delete userData.pinCode;
        delete userData.password;

        return {
            code: 200,
            metadata: {
                user: {
                    ...userData,
                    accessToken: token, // ✅ Return it only here
                    hasSetPinCode,
                    unSeenConversations: filteredUnSeenConversations,
                    unSeenNotifications,
                },
            },
        };
    };
}

export default AuthService;
