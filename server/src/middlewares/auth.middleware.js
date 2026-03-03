// server/src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
    try {
        const authHeader =
            req.headers.authorization || req.headers.Authorization;
        let token = null;

        if (
            authHeader &&
            typeof authHeader === "string" &&
            authHeader.startsWith("Bearer ")
        ) {
            token = authHeader.slice(7).trim();
        }

        if (!token && req.cookies) {
            token = req.cookies.accessToken || req.cookies.token;
        }

        if (!token) {
            token = req.headers["x-access-token"] || req.headers["token"];
        }

        if (!token) return res.status(401).json({ message: "Missing token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const uid = decoded.userId || decoded._id || decoded.id || decoded.sub;

        req.user = {
            ...decoded,
            userId: uid,
            _id: uid,
        };

        return next();
    } catch (err) {
        // return res.status(401).json({ message: "Invalid token" });
        console.error("JWT VERIFY FAIL:", err.name, err.message);
        return res
            .status(401)
            .json({ message: "Invalid token", error: err.message });
    }
};
