// server/src/routes/index.js

const router = require("express").Router();

router.get("/", (req, res) => res.send("EDUZO API OK"));

router.use("/auth", require("./auth"));
router.use("/user", require("./user"));
router.use("/classes", require("./class"));
router.use("/students", require("./student"));
router.use("/search", require("./search"));
router.use("/center", require("./center"));
router.use("/class-notes", require("./classNote"));
router.use("/notifications", require("./notification"));
router.use("/feedback", require("./feedback"));
router.use("/attendance", require("./attendance"));

module.exports = router;
