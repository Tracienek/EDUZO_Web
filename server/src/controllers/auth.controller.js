//auth.controller.js

const { sendResetPasswordEmail } = require("../utils/mailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );
};

exports.signUp = async (req, res) => {
    try {
        const { email, fullName, password } = req.body;

        if (!email || !fullName || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (String(password).length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters" });
        }
        if (!process.env.JWT_SECRET) {
            return res
                .status(500)
                .json({ message: "JWT_SECRET is missing in .env" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existed = await User.findOne({ email: normalizedEmail }).lean();
        if (existed)
            return res.status(409).json({ message: "Email already exists" });

        user.passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: normalizedEmail,
            fullName: String(fullName).trim(),
            passwordHash,
            role: "center",
        });

        const accessToken = signToken(user);

        return res.status(201).json({
            metadata: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                },
                accessToken,
            },
        });
    } catch (err) {
        console.error("signUp error:", err);
        return res.status(500).json({ message: "Sign up failed" });
    }
};

exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }
        if (!process.env.JWT_SECRET) {
            return res
                .status(500)
                .json({ message: "JWT_SECRET is missing in .env" });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+passwordHash",
        );

        if (!user) {
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return res
                .status(401)
                .json({ message: "Invalid email or password" });

        const accessToken = signToken(user);

        // auth.controller.js (trong signIn)
        return res.json({
            metadata: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    mustChangePassword: user.mustChangePassword || false, //  add
                },
                accessToken,
            },
        });
    } catch (err) {
        console.error("signIn error:", err);
        return res.status(500).json({ message: "Sign in failed" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const email = (req.body.email || "").trim().toLowerCase();
        const genericMsg =
            "If an account exists for this email, a password reset link has been sent.";

        if (!email) return res.status(200).json({ message: genericMsg });

        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ message: genericMsg });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${rawToken}`;

        // quan trọng: để mailer throw nếu fail
        await sendResetPasswordEmail(user.email, resetUrl);

        return res.status(200).json({ message: genericMsg });
    } catch (err) {
        console.error("forgotPassword error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const rawToken = req.params.token;
        const password = req.body.password || "";

        if (!rawToken)
            return res.status(400).json({ message: "Invalid token" });
        if (password.length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters." });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        }).select("+passwordHash"); // optional

        if (!user) {
            return res
                .status(400)
                .json({ message: "Token is invalid or expired." });
        }

        user.passwordHash = await bcrypt.hash(password, 10);

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res
            .status(200)
            .json({ message: "Password reset successful. Please sign in." });
    } catch (err) {
        console.error("resetPassword error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
};
