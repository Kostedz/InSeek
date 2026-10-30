import {hasValue, normalizeStudentValue} from "../../offresUtils.js";

export function getStudentIdentifiers(user) {
    return [user?.id, user?.email, user?.studentId, user?.etudiantId]
        .filter(hasValue)
        .map((value) => String(value).trim().toLowerCase());
}

export function getOfferRestrictionIdentifiers(offer) {
    const restrictionFields = [
        offer.studentId,
        offer.etudiantId,
        offer.targetStudentId,
        offer.restrictedToStudentId,
        offer.studentEmail,
        offer.etudiantEmail,
        offer.targetStudentEmail,
        offer.restrictedToStudentEmail,
        offer.restrictedToStudent,
        offer.targetStudent,
        ...(Array.isArray(offer.studentIds) ? offer.studentIds : []),
        ...(Array.isArray(offer.etudiantIds) ? offer.etudiantIds : []),
        ...(Array.isArray(offer.targetStudentIds) ? offer.targetStudentIds : []),
        ...(Array.isArray(offer.restrictedStudentIds) ? offer.restrictedStudentIds : []),
        ...(Array.isArray(offer.students) ? offer.students : []),
        ...(Array.isArray(offer.etudiants) ? offer.etudiants : []),
        ...(Array.isArray(offer.targetStudents) ? offer.targetStudents : []),
    ];

    return restrictionFields.flatMap(normalizeStudentValue);
}