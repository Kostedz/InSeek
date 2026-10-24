import api from "./api.js";

export async function countPendingDocuments(type) {
    try {
        const response = await api.gestionnaire.getPendingDocuments(type);
        if (!response.ok) return null;

        const payload = await response.json();
        const documents = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? [];
        return documents.length;
    } catch {
        return null;
    }
}