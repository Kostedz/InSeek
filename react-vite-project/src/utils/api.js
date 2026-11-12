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

        demoLogin: (role) =>
            fetcher(`/user/demo/login?role=${encodeURIComponent(role)}`, {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        prepareStudentDemo: () =>
            fetcher("/user/demo/student-demo", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        prepareStudentContractDemo: () =>
            fetcher("/user/demo/student-contract-demo", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        prepareDelayedNotificationsDemo: () =>
            fetcher("/user/demo/delayed-notifications-demo", {
                skipAuth: true,
                method: "POST",
                headers: {Accept: "application/json"},
            }),

        getMe: () => fetcher("user/me", {}),
    },

    student: {
        updateDiscipline: (discipline) => fetcher("/user/me/discipline", {
            method: "PATCH",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({discipline}),
        }),

        getCv: () => fetcher("/documents/student/cv", {
            headers: {Accept: "application/json"},
        }),

        getOffers: () => fetcher("/documents/stages", {
            headers: {Accept: "application/json"},
        }),

        getConvocations: () => fetcher("/interviews/student", {
            headers: {Accept: "application/json"},
        }),

        getContract: () => fetcher("/contracts/student/me", {
            headers: {Accept: "application/json"},
        }),

        getContractPdf: (contractId) => fetcher(`/contracts/${encodeURIComponent(contractId)}/pdf`, {
            headers: {Accept: "application/pdf"},
        }),

        signContract: (contractId, password) => fetcher(`/contracts/sign/${encodeURIComponent(contractId)}`, {
            method: "PATCH",
            headers: {Accept: "application/json", "Content-Type": "application/json;charset=UTF-8"},
            body: JSON.stringify({password}),
        }),

        getDemoContractPdf: (signatureDates = {}) => {
            const params = new URLSearchParams();
            if (signatureDates.studentSignedAt) params.set("studentSignedAt", signatureDates.studentSignedAt);
            if (signatureDates.employerSignedAt) params.set("employerSignedAt", signatureDates.employerSignedAt);
            if (signatureDates.managerSignedAt) params.set("managerSignedAt", signatureDates.managerSignedAt);
            const query = params.toString();
            return fetcher(`/contracts/dev/demo-pdf${query ? `?${query}` : ""}`, {
                headers: {Accept: "application/pdf"},
            });
        },

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

        getContracts: () =>
            fetcher("/contracts/student", {
                cache: "no-store",
                headers: {Accept: "application/json"},
            }),
    },

    documents: {
        getFile: (documentId) => fetcher(`/documents/${encodeURIComponent(documentId)}/file`, {
            headers: {Accept: "application/pdf"},
        }),
    },

    employer: {
        getContracts: () =>
            fetcher("/contracts/employer", {
                cache: "no-store",
                headers: {Accept: "application/json"},
            }),

        signContract: (contractId, password) =>
            fetcher(`/contracts/sign/${encodeURIComponent(contractId)}`, {
                method: "PATCH",
                headers: {Accept: "application/json", "Content-Type": "application/json;charset=UTF-8"},
                body: JSON.stringify({password}),
            }),

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
            accept: (id) => fetcher(`/api/applications/${encodeURIComponent(id)}/accept`, {
                method: "PUT",
                headers: {Accept: "application/json"},
            }),

            reject: (id, commentaire) => fetcher(`/api/applications/${encodeURIComponent(id)}/reject`, {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({commentaire: commentaire ? commentaire.trim() : ""}),
            }),
        },
    },

    gestionnaire: {
        getAcademicSessions: () =>
            fetcher("/gestionnaire/sessions", {headers: {Accept: "application/json"}}),

        getStudentsBySession: (sessionId) =>
            fetcher(`/gestionnaire/stagiaires/${encodeURIComponent(sessionId)}`, {
                headers: {Accept: "application/json"},
            }),

        getInternshipStudents: () =>
            fetcher("/gestionnaire/stagiaires", {headers: {Accept: "application/json"}}),

        getProfessors: () =>
            fetcher("/gestionnaire/professeurs", {headers: {Accept: "application/json"}}),

        assignProfessor: (studentId, professorId) =>
            fetcher(`/gestionnaire/stagiaires/${encodeURIComponent(studentId)}/professeur`, {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({professeurId: professorId}),
            }),

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

        getEligibleStudents: () =>
            fetcher("/contracts/eligible-students", {
                headers: { Accept: "application/json" },
            }),

        getContractData: (studentId, offerId) =>
            fetcher(`/contracts/prefilled/${encodeURIComponent(studentId)}?offerId=${encodeURIComponent(offerId)}`, {
                headers: { Accept: "application/json" },
            }),

        createContract: (contractData) =>
            fetcher("/contracts/contracts", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify(contractData),
            }),

        getContracts: () =>
            fetcher("/contracts/contracts", {
                cache: "no-store",
                headers: { Accept: "application/json" },
            }),

        signContract: (contractId, password) => fetcher(`/contracts/sign/${encodeURIComponent(contractId)}`, {
            method: "PATCH",
            headers: {Accept: "application/json", "Content-Type": "application/json;charset=UTF-8"},
            body: JSON.stringify({password}),
        }),

        getSessions: () =>
            fetcher("/gestionnaire/sessions", {
                headers: { Accept: "application/json" },
            }),

        getAllOffers: () =>
            fetcher("/documents/stage", {
                headers: {Accept: "application/json"},
            }),

        getOffersBySession: (sessionId, filters = {}) => {
            const queryParams = new URLSearchParams(filters).toString();
            const query = queryParams ? `?${queryParams}` : "";
            return fetcher(`/gestionnaire/sessions/${encodeURIComponent(sessionId)}/offres${query}`, {
                headers: { Accept: "application/json" },
            })
        },
    },

    professor: {
        getStudents: (sessionId) => {
            const path = sessionId === "ALL"
                ? "/professeur/etudiants"
                : `/professeur/etudiants/${encodeURIComponent(sessionId)}`;
            return fetcher(path,
                {headers: {Accept: "application/json"}});
        },

        getStudentApplications: (studentId) =>
            fetcher(`/professeur/etudiants/${encodeURIComponent(studentId)}/demandes`, {
                headers: {Accept: "application/json"},
            }),
    },

};

export default api;
