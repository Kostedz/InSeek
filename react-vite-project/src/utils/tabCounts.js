import api from "./api.js";

export const PENDING_DOCUMENT_PROCESSED_EVENT = "gestionnaire:pending-document-processed";
export const STUDENT_TAB_COUNTS_CHANGED_EVENT = "inseek:student-tab-counts-changed";

export function notifyPendingDocumentProcessed(type) {
    window.dispatchEvent(new CustomEvent(PENDING_DOCUMENT_PROCESSED_EVENT, {detail: {type}}));
}

export function notifyStudentTabCountsChanged() {
    window.dispatchEvent(new Event(STUDENT_TAB_COUNTS_CHANGED_EVENT));
}

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
