import {getApplicationStatus} from "./offresGetterUtils.js";
import {EMPTY_FORM} from "./offresConstants.js";
import {createTranslationMessage} from "../../../../utils/i18nMessage.js";

export function sanitizeSalary(value) {
    const sanitized = String(value ?? "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
    const [whole, ...decimalParts] = sanitized.split(".");
    return decimalParts.length > 0 ? `${whole}.${decimalParts.join("")}` : whole;
}

export function applyDecisions(applications, decisions) {
    return applications.map((application) => {
        const decision = decisions[String(application.id)];
        if (!decision || getApplicationStatus(application) !== "PENDING") return application;
        return {...application, status: decision.status, rejectionComment: decision.comment};
    });
}

export function formValuesFromOffer(offer, defaultCompanyName = "") {
    if (!offer) return {...EMPTY_FORM, nomEntreprise: defaultCompanyName};

    return {
        nomEntreprise: defaultCompanyName || offer.nomEntreprise || "",
        contactName: offer.contactName ?? "",
        email: offer.email ?? "",
        contactPhone: offer.contactPhone ?? "",
        position: offer.position ?? "",
        targetDiscipline: offer.targetDiscipline ?? "",
        adresseEntreprise: offer.adresseEntreprise ?? "",
        salaire: offer.salaire ?? "",
        dateDebutStage: offer.dateDebutStage ?? "",
        dateFinStage: offer.dateFinStage ?? "",
        descriptionPosition: offer.descriptionPosition ?? "",
    };
}

export function formatDate(value, language) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function buildOfferSubmissionFormData({file, fields, offerId}) {
    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("formContent", JSON.stringify({
        type: "OffreDeStage",
        offerId: offerId ?? null,
        nomEntreprise: fields.nomEntreprise,
        position: fields.position,
        descriptionPosition: fields.descriptionPosition,
        dateDebutStage: fields.dateDebutStage,
        dateFinStage: fields.dateFinStage,
        adresseEntreprise: fields.adresseEntreprise,
        salaire: fields.salaire === "" ? null : Number(fields.salaire),
        contactName: fields.contactName,
        email: fields.email,
        contactPhone: fields.contactPhone,
        targetDiscipline: fields.targetDiscipline,
    }));
    return formData;
}

export function errorForOfferStatus(status) {
    if (status === 401) return createTranslationMessage("errors.unauthorized");
    if (status === 403) return createTranslationMessage("errors.forbidden");
    return createTranslationMessage("employerOffers.errors.loadFailed");
}