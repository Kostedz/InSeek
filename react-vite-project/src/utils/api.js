import fetcher from "./fetcher.js";

const interviewBody = (offerId, candidatId, payload) => JSON.stringify({
    offerId: Number(offerId),
    studentId: Number(candidatId),
    DateAndTime: payload.dateHeure,
    mode: payload.mode,
    locationOrLink: payload.lieuOuLien,
    message: payload.messageOptionnel || "",
});

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

        devLogin: (role) =>
            fetcher(role ? `/user/dev/login?role=${encodeURIComponent(role)}` : "/user/dev/login", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        prepareStudentDemo: () =>
            fetcher("/user/dev/student-demo", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        getMe: () => fetcher("user/me", {}),
    },

    student: {
        getCv: () => fetcher("/documents/student/cv", {
            headers: {Accept: "application/json"},
        }),

        getOffers: () => fetcher("/documents/stage", {
            headers: {Accept: "application/json"},
        }),

        getConvocations: () => fetcher("/interviews/student", {
            headers: {Accept: "application/json"},
        }),

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

        respondToConvocation: (interviewId, responseDTO) => {
            return fetcher(`/interviews/${interviewId}/respond`, {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(responseDTO),
            });
        },


        applyToOffer: (offerId) =>
            fetcher(`/api/applications/${encodeURIComponent(offerId)}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
            }),

        getAppliedOfferIds: () =>
            fetcher("/api/applications/my-applications", {
                headers: {Accept: "application/json"},
            }),

        getApplications: () =>
            fetcher("/api/applications/my-applications/details", {
                headers: {Accept: "application/json"},
            }),
    },

    documents: {
        getFile: (documentId) => fetcher(`/documents/${encodeURIComponent(documentId)}/file`, {
            headers: {Accept: "application/pdf"},
        }),
    },

    employer: {
        offers: {
            list: () => fetcher("/employeur/offres", {
                cache: "no-store",
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
            planifierEntrevue: (offerId, candidatId, payload) => fetcher("/interviews/schedule", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: interviewBody(offerId, candidatId, payload),
            }),
           modifierEntrevue: (offerId, candidatId, payload) => fetcher("/interviews/update", {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: interviewBody(offerId, candidatId, payload),
            }),
        },
        applications: {
            list: (offerId) => fetcher(`/api/applications/offer/${encodeURIComponent(offerId)}`, {
                cache: "no-store",
                headers: {Accept: "application/json"},
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
