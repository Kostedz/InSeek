export function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

export function normalizeOfferStatus(value) {
    const status = String(value ?? "").trim().toUpperCase();

    if (["VALIDE", "VALIDATED", "APPROVED"].includes(status)) return "VALIDE";
    if (["REJETE", "REJECTED", "REJECT"].includes(status)) return "REJETE";
    return "EN_ATTENTE";
}

export function normalizeApplicationStatus(value) {
    const status = String(value ?? "").trim().toUpperCase();

    if (["ACCEPTE", "ACCEPTEE", "ACCEPTED"].includes(status)) return "ACCEPTEE";
    if (["REJETE", "REJETEE", "REFUSEE", "REJECTED"].includes(status)) return "REFUSEE";
    if (["VALIDE", "VALIDATED", "IN_REVIEW", "EN_COURS_D_EXAMEN"].includes(status)) {
        return "EN_COURS_D_EXAMEN";
    }
    return "SOUMISE";
}

export function normalizeOffer(offer = {}) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        fileName: offer.fileName ?? offer.filename ?? "",
        statut: normalizeOfferStatus(offer.statut ?? offer.status),
        title: offer.position ?? offer.jobTitle ?? offer.title ?? "",
        company: offer.nomEntreprise ?? offer.companyName ?? offer.company ?? "",
        description: offer.descriptionPosition ?? offer.description ?? "",
        publicationDate: offer.publishedAt ?? offer.datePublication ?? offer.createdAt ?? offer.updatedAt,
        startDate: offer.dateDebutStage ?? offer.startDate,
        endDate: offer.dateFinStage ?? offer.endDate,
        address: offer.adresseEntreprise ?? offer.companyAddress ?? offer.location ?? "",
        salary: offer.salaire ?? offer.salary ?? offer.hourlyPay,
        contactName: offer.contactName ?? offer.contactPerson ?? "",
        contactPhone: offer.contactPhone ?? offer.phone ?? "",
        discipline: offer.targetDiscipline ?? offer.discipline ?? "",
    };
}

export function normalizeApplication(application) {
    const offer = application?.offreDeStageDTO
        ?? application?.offer
        ?? application?.offre
        ?? {};

    return {
        id: application?.id,
        appliedAt: application?.dateApplique ?? application?.appliedAt ?? application?.createdAt,
        status: normalizeApplicationStatus(application?.statutValidation ?? application?.status),
        offer: normalizeOffer(offer),
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

export function formatDateRange(startDate, endDate, language, t, translationPrefix) {
    const start = formatDate(startDate, language);
    const end = formatDate(endDate, language);

    if (!start && !end) return t(`${translationPrefix}.notSpecified`);
    if (!start) return end;
    if (!end) return start;

    return t(`${translationPrefix}.dateRange`, {start, end});
}

export function formatSalary(value, language, t, unpaidTranslationKey) {
    if (!hasValue(value)) return t(unpaidTranslationKey);

    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);

    return `${new Intl.NumberFormat(language === "en" ? "en-CA" : "fr-CA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)} $/h`;
}

export function formatDiscipline(value, t) {
    if (!value) return "";

    const rawValue = String(value).trim();
    const normalized = rawValue.toUpperCase().replace(/[.\s-]+/g, "_");
    const aliases = {
        TECH_INFIRMIERE: "INFIRMIERE",
    };
    const translationKey = aliases[normalized] ?? normalized;

    return t(`employerOffers.disciplines.${translationKey}`, {
        defaultValue: rawValue.replace(/_/g, " "),
    });
}

export function formatOfferTitle(value) {
    if (!value) return "";

    return String(value)
        .replace(/tech[_\s-]+infirmiere/gi, "tech. infirmière")
        .replace(/genie[_\s-]+civil/gi, "génie civil")
        .replace(/design[_\s-]+graphique/gi, "design graphique")
        .replace(/_/g, " ");
}

export function truncateDescription(value, length = 155) {
    const description = String(value ?? "").trim();
    if (description.length <= length) return description;
    return `${description.slice(0, length).trimEnd()}…`;
}

export function normalizeStudentValue(value) {
    if (value && typeof value === "object") {
        return [value.id, value.studentId, value.etudiantId, value.email, value.studentEmail, value.etudiantEmail]
            .filter(hasValue)
            .map((candidate) => String(candidate).trim().toLowerCase());
    }

    return hasValue(value) ? [String(value).trim().toLowerCase()] : [];
}