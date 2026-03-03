// server/src/routes/index.js

const router = require("express").Router();

router.get("/", (req, res) => res.send("EDUZO API OK"));

router.use("/auth", require("./auth.routes"));
router.use("/user", require("./user.routes"));
router.use("/classes", require("./class.routes"));
router.use("/students", require("./student.routes"));
router.use("/search", require("./search.routes"));
router.use("/center", require("./center.routes"));
router.use("/class-notes", require("./classNote.routes"));
router.use("/students", require("./student.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/feedback", require("./feedback.routes"));
// router.use("/mail-test", require("./mailTest.routes"));

module.exports = router;
