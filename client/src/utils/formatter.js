import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export const formatEmailToName = (email) => {
    if (!email || typeof email !== "string") {
        throw new Error("Invalid email address");
    }

    const username = email.split("@")[0];
    return `@${username}`;
};

export function bytesToKilobytes(bytes) {
    const kilobytes = bytes / 1024;
    return kilobytes;
}

export function limitString(str, n) {
    if (!str) {
        return;
    }
    if (str.length <= n) {
        return str;
    }
    return str.substring(0, n) + "..";
}

export function limitStringByPixels(str, maxWidthPx, font = "16px Roboto") {
    if (!str) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;

    let result = "";
    for (let i = 0; i < str.length; i++) {
        const next = result + str[i];
        if (context.measureText(next + "..").width > maxWidthPx) {
            return result + "..";
        }
        result = next;
    }

    return result;
}

export function formatFloat(number, n) {
    if (n === 0) {
        return Math.floor(number); // Alternatively, use Math.round(number) if you want to round to the nearest integer
    }
    return number.toFixed(n);
}

export const formatFileName = (name, prefixLength, maxLength = 20) => {
    if (name.length <= maxLength) return name;

    const dotIndex = name.lastIndexOf(".");
    const extension = dotIndex !== -1 ? name.slice(dotIndex) : "";
    const prefix = name.slice(0, prefixLength);

    return `${prefix}...${extension}`;
};

export function formatNumber(num, digits = 1) {
    if (num === 0) return "0"; // Pad zero as "00"
    if (!num) return ""; // Handle null/undefined cases

    const units = ["", "K", "M", "B", "T"];
    const unitIndex = Math.floor(Math.log10(num) / 3); // Get the index based on powers of 10
    const unitValue = num / Math.pow(1000, unitIndex);

    let result = parseFloat(unitValue.toFixed(digits)) + units[unitIndex];

    // Only pad numbers without units (i.e., unitIndex === 0)
    if (unitIndex === 0 && parseFloat(result) < 10) {
        result = result.toString().padStart(2, "0");
    }

    return result;
}

export function formatCurrency(val, locale = navigator.language) {
    if (val == null) return;

    return Number(val).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatDate(val, { explicit = false } = {}) {
    if (!val) return "";
    const date = new Date(val);
    if (isNaN(date)) return "";

    return new Intl.DateTimeFormat("en-US", {
        month: explicit ? "long" : "short", // control long vs short
        day: "2-digit",
        year: "numeric",
    }).format(date);
    // → "Sep 24, 2025" (default)
    // → "September 24, 2025" (explicit: true)
}

export function formatDatetime(
    val,
    locale = "en-US",
    { explicit = false } = {},
) {
    if (!val) return "";
    const date = new Date(val);
    if (isNaN(date)) return "";

    return new Intl.DateTimeFormat(locale, {
        month: explicit ? "long" : "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(date);
    // → "Sep 24, 2025, 03:15 PM"
    // → "September 24, 2025, 03:15 PM"
}
export function formatTimeAgo(date) {
    try {
        const now = dayjs();
        const then = dayjs(date);
        const diffSec = now.diff(then, "second");

        //  NEW: if less than 2 seconds → "just now"
        if (diffSec < 2) return "just now";

        if (diffSec < 60) return `${diffSec}s`;

        const diffMin = now.diff(then, "minute");
        if (diffMin < 60) return `${diffMin}m`;

        const diffHour = now.diff(then, "hour");
        if (diffHour < 24) return `${diffHour}h`;

        const diffDay = now.diff(then, "day");
        if (diffDay < 30) return `${diffDay}d`;

        const diffMonth = now.diff(then, "month");
        if (diffMonth < 12) return `${diffMonth}mo`;

        const diffYear = now.diff(then, "year");
        return `${diffYear}y`;
    } catch {
        return "just now";
    }
}

export function maskString(str, n) {
    if (str.length <= n) {
        return str;
    }
    const visiblePart = str.slice(0, n);
    const maskedPart = "*".repeat(str.length - n);
    return visiblePart + maskedPart;
}

export function dateTimeAsYYYYMMDD(date) {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

export function YYYYMMDDAsDDMMYYYY(date) {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

export function camelCaseToCapitalCase(str) {}

export function createClickableLinks(content) {
    const urlPattern =
        /(\b(https?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]))/gi;
    return content.replace(
        urlPattern,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

export function convertToHCMTime(utcDateString) {
    const options = {
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    };

    const date = new Date(utcDateString);
    const hcmTime = date.toLocaleString("en-GB", options);

    // Reformat the date to hh:mm dd/mm/yyyy
    const [time, datePart] = hcmTime.split(", ");
    return `${time} ${datePart.replace(/\//g, "/")}`;
}

export const getDaysLeft = (deadline) => {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDifference = deadlineDate - today;
    const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    return daysLeft; // always return number, even negative
};

// Utility to recursively trim all string fields in an object
export const trimInputs = (inputs) => {
    if (typeof inputs !== "object" || inputs === null) return inputs; // Return non-object inputs as-is

    const trimmedInputs = Array.isArray(inputs) ? [] : {};

    for (const key in inputs) {
        if (inputs.hasOwnProperty(key)) {
            const value = inputs[key];
            if (typeof value === "string") {
                trimmedInputs[key] = value.trim(); // Trim strings
            } else if (typeof value === "object" && value !== null) {
                trimmedInputs[key] = trimInputs(value); // Recursively handle nested objects/arrays
            } else {
                trimmedInputs[key] = value; // Copy non-string values as-is
            }
        }
    }

    return trimmedInputs;
};

export const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email; // Return as is if not a valid email

    const [localPart, domain] = email.split("@");
    const maskedLocalPart = localPart.slice(0, -3) + "***";

    return `${maskedLocalPart}@${domain}`;
};

export default function getSpotifyEmbedUrl(inputUrl) {
    const match = inputUrl.match(
        /https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    );
    if (match && match[1]) {
        return `https://open.spotify.com/embed/track/${match[1]}`;
    }
    return null; // or a fallback/default embed
}

// Tính thời gian còn lại
export const formatTimeLeft = (endAt) => {
    const now = dayjs();
    const endTime = dayjs(endAt);
    const diff = endTime.diff(now);

    if (diff <= 0) return "Synthesizing";

    const dur = dayjs.duration(diff);
    const days = Math.floor(dur.asDays());
    const hours = dur.hours();
    const minutes = dur.minutes();

    return `${days}d ${hours}h ${minutes}m`;
};

export const formatToLocalTime = (utcString, timeZone) => {
    const date = new Date(utcString);
    const finalTimeZone =
        timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const timePart = date.toLocaleTimeString("en-US", {
        timeZone: finalTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    const datePart = date.toLocaleDateString("en-GB", {
        timeZone: finalTimeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const result = `${timePart}, ${datePart}`;

    return result;
};

// utils/timeZoneFormatter.ts
export const formatTimeZone = (timeZone) => {
    if (!timeZone) return "dd/mm/yyyy";

    try {
        // Create a date in the specified timezone
        const now = new Date();
        const dateInTZ = new Intl.DateTimeFormat("en-US", {
            timeZone,
            timeZoneName: "short",
            hour: "2-digit",
            minute: "2-digit",
        }).format(now);
        return `${timeZone} (${dateInTZ})`; // e.g. "Asia/Ho_Chi_Minh (09:00 GMT+7)"
    } catch (err) {
        console.error("Invalid timeZone:", timeZone);
        return "Invalid Time Zone";
    }
};

export function stripHtmlTags(html = "") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

export function limitHtmlContent(html, limit) {
    const text = stripHtmlTags(html);
    if (text.length <= limit) return wrapUrlsWithLinks(html);

    const limitedText = text.slice(0, limit) + "…";
    return `<p>${wrapUrlsWithLinks(limitedText)}</p>`;
}

export function countWordsFromHtml(htmlContent = "") {
    // Remove HTML tags and extra spaces
    const textContent = htmlContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!textContent) return 0;

    // Split by space and count words
    return textContent.split(" ").length;
}

// utils/stringUtils.js
export function estimateReadingTime(htmlContent = "", wordsPerMinute = 250) {
    const text = htmlContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!text) return 0;

    const wordCount = text.split(" ").length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return minutes;
}

export function getTimeRemaining(expiredAt) {
    const expires = new Date(expiredAt);
    const now = new Date();

    const diffMs = expires - now;

    if (diffMs <= 0) return "Expired";

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
        (diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
    );
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export function extractPlainText(html = "") {
    if (!html) return "";

    // 1. Create a temporary DOM element
    const temp = document.createElement("div");

    // 2. Assign the HTML string
    temp.innerHTML = html;

    // 3. Return the text content only (strips tags + decodes HTML entities)
    return temp.textContent || temp.innerText || "";
}

// --- shared helper for link wrapping ---
function wrapUrlsWithLinks(htmlOrText = "") {
    if (!htmlOrText) return "";

    const urlRegex = /\b(https?:\/\/[^\s<>]+[^\s<>'")\]])/gi;

    return htmlOrText.replace(urlRegex, (url) => {
        let displayText = url.replace(/^https?:\/\//, "");
        if (displayText.length > 25)
            displayText = displayText.slice(0, 25) + "…";
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="blue-3-color">${displayText}</a>`;
    });
}

export function htmlToOneLineText(html = "") {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = (div.textContent || div.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
    return text;
}
export function formatHtmlWithLinks(html = "", { limit = null } = {}) {
    if (!html) return "";

    let content = wrapUrlsWithLinks(html);

    if (limit) {
        content = limitHtmlPreserveStructure(content, limit);
    }

    content = content.replace(/\n/g, "<br/>");
    return content;
}

// cut by chars (keeps words if possible)
export function limitHtmlToText(html = "", limit = 80, keepWords = true) {
    const text = htmlToOneLineText(html);
    if (text.length <= limit) return wrapUrlsWithLinks(text);
    if (!keepWords) return wrapUrlsWithLinks(text.slice(0, limit) + "…");
    const slice = text.slice(0, limit);
    return wrapUrlsWithLinks(slice.replace(/\s+\S*$/, "") + "…");
}

export function limitHtmlPreserveStructure(html = "", limit = 200) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;

    let charCount = 0;
    let reachedLimit = false;

    function traverse(node) {
        let clone = node.cloneNode(false);

        for (let child of node.childNodes) {
            if (reachedLimit) break;

            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent;
                const remaining = limit - charCount;

                if (text.length <= remaining) {
                    charCount += text.length;
                    clone.appendChild(child.cloneNode(true));
                } else {
                    const sliced = text.slice(0, remaining) + "…";
                    const linked = wrapUrlsWithLinks(sliced);
                    const temp = document.createElement("span");
                    temp.innerHTML = linked;
                    temp.childNodes.forEach((n) => clone.appendChild(n));
                    reachedLimit = true;
                    break;
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childClone = traverse(child);
                if (childClone) clone.appendChild(childClone);
            }
        }
        return clone;
    }

    const limited = traverse(div);
    return limited.innerHTML;
}

// utils/trimQuill.js
export const trimQuillText = (html = "") => {
    if (!html) return "";

    // Remove leading/trailing whitespace + empty <p><br></p> etc.
    let cleaned = html
        .replace(/(<p><br><\/p>)+/g, "") // strip empty lines
        .replace(/&nbsp;/g, " ") // normalize non-breaking spaces
        .trim();

    return cleaned;
};

// utils/quillHelpers.js
export const hasQuillContent = (html = "") => {
    if (!html) return false;

    // Remove HTML tags
    const textOnly = html
        .replace(/<(.|\n)*?>/g, "") // remove tags
        .replace(/&nbsp;/g, " ") // replace &nbsp; with space
        .trim();

    return textOnly.length > 0;
};

export const displayPronoun = (pronoun) => {
    return pronoun == "him"
        ? "he/him"
        : pronoun == "her"
          ? "she/her"
          : pronoun == "them"
            ? "they/them"
            : pronoun;
};

export function formatUtcTime(dateInput) {
    const date = new Date(dateInput);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes} UTC`;
}
export const formatSensitiveValue = (value) => {
    if (!value || typeof value !== "string") return "-";
    return value.slice(0, 3) + "*".repeat(Math.max(0, value.length - 3));
};

export function timeAgo(targetDate, unit = "day") {
    const now = new Date();
    const date = new Date(targetDate);

    const diffMs = now - date; // past → positive, future → negative

    const units = {
        second: 1000,
        minute: 1000 * 60,
        hour: 1000 * 60 * 60,
        day: 1000 * 60 * 60 * 24,
        week: 1000 * 60 * 60 * 24 * 7,
        month: 1000 * 60 * 60 * 24 * 30, // simplified
        year: 1000 * 60 * 60 * 24 * 365, // simplified
    };

    const msPerUnit = units[unit] || units["day"];
    return diffMs / msPerUnit; // returns float number
}
