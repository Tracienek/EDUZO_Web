export function isFilled(val) {
    return (
        val !== null &&
        val !== undefined &&
        (typeof val !== "string" || val.trim() !== "")
    );
}

export function minLength(val, length) {
    return val.length >= length;
}

export function maxLength(val, length) {
    return val.length < length;
}

export function isMatch(val1, val2) {
    return val1 === val2;
}

export function minValue(val, min) {
    return val >= min;
}

export function maxValue(val, max) {
    return val <= max;
}

export function hasSymbol(val) {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(val);
}

export function isValidEmail(val) {
    return /\S+@\S+\.\S+/.test(val);
}

export function isValidPhone(val) {
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return phoneRegex.test(val);
}

export function hasDigit(val) {
    return /[0-9]/.test(val);
}

export function isValidPassword(password) {
    return minLength(password, 6) && hasDigit(password) && hasSymbol(password);
}

export function isInRange(number, min, max) {
    return number >= min && number <= max;
}

export const isValidYouTubeUrl = (url) => {
    const regex =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]{11}(&.*)?$/;
    return regex.test(url.trim());
};

export const isWithinDays = (dateInput, days) => {
    if (!dateInput || !days) return false;

    const given = new Date(dateInput);
    const now = new Date();

    // Calculate absolute difference in milliseconds
    const diffMs = Math.abs(now - given);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
};
