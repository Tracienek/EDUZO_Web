import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }, // Token validity
    );
};

const ALPHABET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate a 12-char Base62 referral code from a unique userId.
 * - Deterministic (same userId -> same code)
 * - Secret-hardened (not guessable without secret)
 * - 12 chars (~71.5 bits) is effectively unique at 10M users
 */
export function generateReferralCode(
    userId,
    secret = process.env.REFCODE_SECRET,
    length = 12,
) {
    if (!secret) throw new Error("Missing REFCODE_SECRET");
    const payload = `ref|${String(userId)}`; // minimal namespacing
    const mac = crypto.createHmac("sha256", secret).update(payload).digest(); // 32 bytes
    const raw = toBase62(mac);
    return raw.length >= length
        ? raw.slice(0, length)
        : raw.padStart(length, "0");
}

function toBase62(buf) {
    let x = BigInt("0x" + buf.toString("hex"));
    if (x === 0n) return ALPHABET[0];
    let out = "";
    while (x > 0n) {
        out = ALPHABET[Number(x % 62n)] + out;
        x /= 62n;
    }
    return out;
}

// --- Reserved route segments (same level as :userDomainName) ---
export const RESERVED_PATHS = new Set(
    [
        "",
        "posts",
        "archive",
        "not-found",
        "order-management",
        "my-commission-requests",
        "talent-hub",
        "badges",
        "orders",
        "characters",
        "commission-hub",
        "oc-universe",
        "galaxies",
        "newss",
        "search",
        "threads",
        "paypal",
        "dashboard",
        "auth",
        "statics",
        "error",
        "forbidden",
        "favicon.ico",
        "robots.txt",
        "sitemap.xml",
    ].map((s) => s.toLowerCase()),
);

// keep a-z0-9- only; collapse hyphens; trim; fallback to "user"
export function sanitizeDomainBase(input) {
    return (
        (input || "")
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "") || "user"
    );
}

// Allocate a unique, non-reserved domainName.
// `existsFn` is an async function: (probe) => Promise<boolean>  (e.g., () => User.exists({domainName: probe}))
export async function allocateUniqueDomainName(base, existsFn, maxTries = 50) {
    // Clean: lowercase, remove non-alphanumeric characters (no dashes)
    const clean = base
        .toLowerCase()
        .normalize("NFD") // remove accents like ư, ố
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "") // only keep letters and numbers
        .slice(0, 30);

    if (!clean) throw new Error("Invalid base for domain name");

    // First try: exact match
    for (let i = 0; i < maxTries; i++) {
        const probe = i === 0 ? clean : `${clean}${i}`;
        if (RESERVED_PATHS.has(probe)) continue;
        if (!(await existsFn(probe))) return probe;
    }

    // Fallback: random numeric suffix
    for (let i = 0; i < 100; i++) {
        const probe = `${clean}${Math.floor(Math.random() * 10000)}`;
        if (RESERVED_PATHS.has(probe)) continue;
        if (!(await existsFn(probe))) return probe;
    }

    // Final fallback: timestamp (still without "-")
    return `${clean}${Date.now()}`;
}

export { generateToken };
