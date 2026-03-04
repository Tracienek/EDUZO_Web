// server/src/app.js
const sib = require("@getbrevo/brevo");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
app.set("etag", false);

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log("📌 MongoDB connected"))
    .catch((err) => console.error("Mongo error:", err.message));

app.get("/", (req, res) => res.send("EDUZO API OK"));

// static
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/v1/api", require("./routes"));

module.exports = app;
