import { User } from "../user.model.js";

const removeAccents = (str) => {
    return str
        .normalize("NFD") // remove accents
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .toLowerCase() // convert to lowercase
        .replace(/[^a-z0-9]/g, ""); // remove special characters and spaces
};

function isAllowedEmail(email) {
    return (
        typeof email === "string" && email.toLowerCase().endsWith("@gmail.com")
    );
}

export const updateUserPushToken = async (userId, token) => {
    if (!token) throw new Error("Push token is required");
    const updated = await User.findByIdAndUpdate(
        userId,
        { pushToken: token },
        { new: true },
    );
    return updated;
};

export { removeAccents, isAllowedEmail };
