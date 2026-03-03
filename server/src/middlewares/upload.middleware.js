// server/src/middlewares/upload.middleware.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
        const safeExt = allowedExt.includes(ext) ? ext : "";
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(
        file.mimetype,
    );
    if (!ok) return cb(new Error("Only JPG/PNG/WEBP are allowed"));
    cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
}).single("avatar");

module.exports = { uploadAvatar, UPLOAD_DIR };
