//auth.controller.js

const bcrypt = require("bcrypt");
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

        const passwordHash = await bcrypt.hash(password, 10);

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
                    mustChangePassword: user.mustChangePassword || false, // ✅ add
                },
                accessToken,
            },
        });
    } catch (err) {
        console.error("signIn error:", err);
        return res.status(500).json({ message: "Sign in failed" });
    }
};
