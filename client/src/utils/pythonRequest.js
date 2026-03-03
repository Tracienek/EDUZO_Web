// ./utils/pythonRequest.js
import axios from "axios";

const pythonRequest = axios.create({
    baseURL:
        import.meta.env.VITE_ENV === "production"
            ? import.meta.env.VITE_PYTHON_API_PROD_ORIGIN
            : import.meta.env.VITE_PYTHON_API_ORIGIN,
    withCredentials: false,
});

const getPythonRequestConfig = (data) => {
    let contentType = "application/json";

    if (data instanceof FormData) {
        contentType = "multipart/form-data";
    }

    return {
        headers: {
            "Content-Type": contentType,
        },
    };
};

/**
 * API utility wrapper
 */
const pythonApiUtils = {
    async get(url, config = {}) {
        const requestConfig = { ...getPythonRequestConfig(), ...config };
        return pythonRequest.get(url, requestConfig);
    },

    async post(url, data = {}, config = {}) {
        const requestConfig = { ...getPythonRequestConfig(data), ...config };
        return pythonRequest.post(url, data, requestConfig);
    },

    async put(url, data = {}, config = {}) {
        const requestConfig = { ...getPythonRequestConfig(data), ...config };
        return pythonRequest.put(url, data, requestConfig);
    },

    async patch(url, data = {}, config = {}) {
        const requestConfig = { ...getPythonRequestConfig(data), ...config };
        return pythonRequest.patch(url, data, requestConfig);
    },

    async delete(url, config = {}) {
        const requestConfig = { ...getPythonRequestConfig(), ...config };
        return pythonRequest.delete(url, requestConfig);
    },
};

export { pythonRequest, pythonApiUtils };
