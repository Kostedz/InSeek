import {getOfferRestrictionIdentifiers, getStudentIdentifiers} from "./acceuilGetterUtils.js";

export default function isVisibleToStudent(offer, user) {
    const restrictionIdentifiers = getOfferRestrictionIdentifiers(offer);
    const studentIdentifiers = getStudentIdentifiers(user);
    const visibility = String(offer.visibility ?? offer.visibilite ?? "").trim().toUpperCase();
    const isPrivate = ["PRIVATE", "PRIVE", "PRIVEE", "TARGETED", "CIBLEE", "RESTRICTED", "RESTREINTE"].includes(visibility);
    const hasExplicitRestriction = restrictionIdentifiers.length > 0 || offer.public === false || offer.isPublic === false || isPrivate;

    if (!hasExplicitRestriction) return true;

    return restrictionIdentifiers.some((identifier) => studentIdentifiers.includes(identifier));
}