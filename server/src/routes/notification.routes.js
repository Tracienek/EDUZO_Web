// server/src/routes/notification.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/notification.controller");

router.get("/", auth, ctrl.getMyNotifications);

router.patch("/read-all", auth, ctrl.markAllRead);
router.delete("/delete-all", auth, ctrl.deleteAllNotifications);

router.patch("/:id/read", auth, ctrl.markRead);
router.delete("/:id", auth, ctrl.deleteNotification);

module.exports = router;
