// server/src/routes/user.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { uploadAvatar } = require("../middlewares/upload.middleware");

router.get("/me", authMiddleware, ctrl.me);
router.patch("/me", authMiddleware, ctrl.updateMe);

router.patch("/me/avatar", authMiddleware, uploadAvatar, ctrl.updateAvatar);

router.post("/change-password", authMiddleware, ctrl.changePassword);

module.exports = router;
