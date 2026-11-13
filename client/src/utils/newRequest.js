import axios from "axios";

const TOKEN_KEY = "accessToken";

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

const newRequest = axios.create({
    baseURL:
        (import.meta.env.VITE_ENV === "production"
            ? import.meta.env.VITE_SERVER_ORIGIN
            : import.meta.env.VITE_SERVER_LOCAL_ORIGIN) + "/v1/api",
    withCredentials: true,
    timeout: 20000,
});

// Attach JWT automatically
newRequest.interceptors.request.use(
    (config) => {
        const token = tokenStore.get();

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor can be enabled later if needed.
// Avoid clearing authentication for every API failure.
// A timeout or server error does not mean the token expired.

const getLoggedInRequestConfig = (data) => {
    let contentType = "application/json";

    if (data instanceof FormData) {
        contentType = "multipart/form-data";
    }

    return {
        withCredentials: true,
        headers: {
            "Content-Type": contentType,
        },
    };
};

const apiUtils = {
    async get(url, config = {}) {
        const requestConfig = {
            ...getLoggedInRequestConfig(),
            ...config,
        };

        return newRequest.get(url, requestConfig);
    },

    async post(url, data = {}, config = {}) {
        const requestConfig = {
            ...getLoggedInRequestConfig(data),
            ...config,
        };

        return newRequest.post(url, data, requestConfig);
    },

    async put(url, data = {}, config = {}) {
        const requestConfig = {
            ...getLoggedInRequestConfig(data),
            ...config,
        };

        return newRequest.put(url, data, requestConfig);
    },

    async patch(url, data = {}, config = {}) {
        const requestConfig = {
            ...getLoggedInRequestConfig(data),
            ...config,
        };

        return newRequest.patch(url, data, requestConfig);
    },

    async delete(url, config = {}) {
        const requestConfig = {
            ...getLoggedInRequestConfig(),
            ...config,
        };

        return newRequest.delete(url, requestConfig);
    },
};

function createFormData(inputs, filesKey, files) {
    const formData = new FormData();

    Object.keys(inputs).forEach((key) => {
        const value = inputs[key];

        if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === "object") {
                formData.append(key, JSON.stringify(value));
            } else {
                value.forEach((item) => {
                    formData.append(`${key}[]`, item);
                });
            }
        } else {
            formData.append(key, value);
        }
    });

    files?.forEach((file) => {
        if (file) {
            formData.append(filesKey, file);
        }
    });

    return formData;
}

export { createFormData, newRequest, apiUtils };
