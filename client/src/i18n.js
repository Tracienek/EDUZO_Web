import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: {
        translation: {
            "classes.online": "Online Class",
            "classes.yours": "Your Classes",
            "common.loading": "Loading...",
        },
    },
    vi: {
        translation: {
            "classes.online": "Lớp đang online",
            "classes.yours": "Lớp của bạn",
            "common.loading": "Đang tải...",
        },
    },
    zh: {
        translation: {
            "classes.online": "在线课程",
            "classes.yours": "你的课程",
            "common.loading": "加载中...",
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
});

export default i18n;
