import {normalizeApplication} from "./offresNormalizeUtils.js";

function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

export function getTodayIso() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

export function getApplicationStatus(application) {
    const status = String(
        application?.status
        ?? application?.statut
        ?? application?.statutCandidature
        ?? application?.statutValidation
        ?? "PENDING"
    ).toUpperCase();
    if (["ACCEPTED", "ACCEPTE", "ACCEPTEE", "ACCEPTÉE", "VALIDE", "APPROVED"].includes(status)) return "ACCEPTED";
    if (["REJECTED", "REJETE", "REJETÉ", "REFUSEE", "REFUSÉE"].includes(status)) return "REJECTED";
    return "PENDING";
}

export function getApplicationsForOffer(offer) {
    const source = offer?.candidatures ?? offer?.applications ?? offer?.candidates;
    if (Array.isArray(source)) return source.map(normalizeApplication);

    return [];
}

export function getApplicationCount(offer) {
    const source = offer?.candidatures ?? offer?.applications ?? offer?.candidates;
    if (Array.isArray(source)) return source.length;
    if (hasValue(offer?.applicationCount ?? offer?.applicationsCount ?? offer?.nombreCandidatures)) {
        return Number(offer.applicationCount ?? offer.applicationsCount ?? offer.nombreCandidatures) || 0;
    }
    return getApplicationsForOffer(offer).length;
}