import fetcher from "./fetcher.js";

export const api = {
    auth: {
        register: (payload) =>
            fetcher("/user/register", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(payload),
            }),

        login: (credentials) =>
            fetcher("/user/login", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(credentials),
            }),

        getMe: () => fetcher("user/me", {}),
    },

    student: {
        uploadCv: (file, documentType = "CV") => {
            const formData = new FormData();
            formData.append("file", file);

            const formContentBlob = new Blob(
                [JSON.stringify({ type: documentType })],
                { type: "application/json" }
            );
            formData.append("formContent", formContentBlob);

            return fetcher("/student/cv/upload", {
                method: "POST",
                body: formData,
            });
        },
    },
};

export default api;