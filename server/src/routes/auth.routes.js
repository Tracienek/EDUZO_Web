const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const userCtrl = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/signUp", ctrl.signUp);
router.post("/signIn", ctrl.signIn);

router.post("/change-password", authMiddleware, userCtrl.changePassword);

module.exports = router;
