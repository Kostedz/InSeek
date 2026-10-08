import fetcher from "./fetcher.js";

export const api = {
    auth: {
        register: (payload) =>
            fetcher("/user/register", {
                skipAuth: true,
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(payload),
            }),

        login: (credentials) =>
            fetcher("/user/login", {
                skipAuth: true,
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(credentials),
            }),

        devLogin: () =>
            fetcher("/user/dev/login", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
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

            return fetcher("/documents/upload", {
                method: "POST",
                body: formData,
            });
        },
    },

    employer: {
        offers: {
            list: () => fetcher("/employeur/offres", {
                headers: {Accept: "application/json"},
            }),

            create: (formData) => fetcher("/documents/upload", {
                method: "POST",
                body: formData,
            }),

            update: (offerId, formData) => fetcher(`/employeur/offres/${offerId}`, {
                method: "PUT",
                body: formData,
            }),
        },
    },

    gestionnaire: {
        getPendingDocuments: (type) => {
            const query = type ? `?type=${encodeURIComponent(type)}` : "";
            return fetcher(`/gestionnaire/documents/pending${query}`, { method: "GET" });
        },

        approveDocument: (id) =>
            fetcher(`/gestionnaire/documents/${id}/approve`, { method: "PUT" }),

        rejectDocument: (id, comment) =>
            fetcher(`/gestionnaire/documents/${id}/reject`, {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({ commentaire: comment }),
            }),
    },
};

export default api;
