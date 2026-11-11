export const normalizeUrl = (raw) => {
    if (typeof raw !== "string") return "";
    const t = raw.trim();
    if (!t) return "";
    // Add protocol if missing
    if (!/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
};

export const isValidHttpUrl = (urlStr) => {
    try {
        const u = new URL(urlStr);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
};
