export function normalizeCv(cv) {
    const firstName = cv.prenom ?? cv.firstName ?? cv.studentFirstName ?? "";
    const lastName = cv.nom ?? cv.lastName ?? cv.studentLastName ?? "";

    return {
        ...cv,
        id: cv.id ?? cv.documentId,
        statut: String(cv.statut ?? cv.status ?? "EN_ATTENTE").toUpperCase(),
        fileName: cv.fileName ?? cv.filename ?? "",
        size: cv.size ?? cv.fileSize,
        firstName,
        lastName,
        studentName: cv.studentName ?? ([firstName, lastName].filter(Boolean).join(" ") || cv.name || cv.etudiant || ""),
        email: cv.email ?? cv.studentEmail ?? "",
        discipline: cv.discipline ?? cv.targetDiscipline ?? cv.programme ?? "",
        submittedAt: cv.submittedAt ?? cv.createdAt ?? cv.dateSoumission ?? "",
        commentaireRejet: cv.commentaireRejet ?? cv.rejectionComment ?? "",
    };
}

export function normalizeOffer(offer, t) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        fileName: offer.fileName ?? offer.filename ?? "",
        statut: String(offer.statut ?? offer.status ?? "EN_ATTENTE").toUpperCase(),
        nomEntreprise: offer.nomEntreprise ?? offer.companyName ?? offer.company ?? "",
        position: offer.position ?? offer.jobTitle ?? offer.title ?? "",
        email: offer.email ?? offer.contactEmail ?? "",
        contactName: offer.contactName ?? offer.contactPerson ?? "",
        contactPhone: offer.contactPhone ?? offer.phone ?? "",
        targetDiscipline: offer.targetDiscipline ?? offer.discipline ?? "",
        dateDebutStage: offer.dateDebutStage ?? offer.startDate,
        dateFinStage: offer.dateFinStage ?? offer.endDate,
        adresseEntreprise: offer.adresseEntreprise ?? offer.companyAddress ?? offer.location ?? "",
        salaire: offer.salaire ?? offer.salary ?? offer.hourlyPay ?? "",
        descriptionPosition: offer.descriptionPosition ?? offer.description ?? "",
    };
}

export function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

export function studentDisplayName(cv) {
    return [cv.firstName, cv.lastName].filter(hasValue).join(" ") || cv.studentName;
}

export function formatDiscipline(value, t) {
    if (!hasValue(value)) return "";
    const normalized = String(value).trim().toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.\s-]+/g, "_");
    const aliases = {
        "TECH_INFIRMIERE": "INFIRMIERE",
        "GENIE_CIVIL": "GENIE_CIVIL",
        "DESIGN_GRAPHIQUE": "DESIGN_GRAPHIQUE",
    };
    const disciplineKey = aliases[normalized] ?? normalized;
    return t(`employerOffers.disciplines.${disciplineKey}`, {defaultValue: value});
}

export function formatDate(value, language) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatFileSizeInMb(size, locale) {
    const bytes = Number(size);
    if (!Number.isFinite(bytes) || bytes < 0) return "";

    return new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(bytes / (1024 * 1024));
}

export function isPending(cv) {
    return cv.statut === "EN_ATTENTE";
}

export function formatDateRange(start, end, language, t) {
    const formattedStart = formatDate(start, language);
    const formattedEnd = formatDate(end, language);

    if (!formattedStart && !formattedEnd) return "";
    if (!formattedStart) return formattedEnd;
    if (!formattedEnd) return formattedStart;

    return t("managerValidation.dateRange", {start: formattedStart, end: formattedEnd});
}

export function formatHourlyPay(value, language, t) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return t("managerValidation.unpaid");
    }

    const amount = Number(value);
    if (!Number.isFinite(amount)) return String(value);

    return `${new Intl.NumberFormat(language === "en" ? "en-CA" : "fr-CA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)} $/h`;
}