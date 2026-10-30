import {DISCIPLINES} from "./offresConstants.js";

export function normalizeStatus(status) {
    const normalized = String(status ?? "").toUpperCase();
    if (["VALIDATED", "VALIDÉ", "VALIDE", "APPROVED", "APPROUVE"].includes(normalized)) return "VALIDE";
    if (["REJECTED", "REJECTE", "REJETÉ", "REJETE"].includes(normalized)) return "REJETE";
    if (["PENDING", "EN_ATTENTE", "EN ATTENTE"].includes(normalized)) return "EN_ATTENTE";
    return "NOT_SUBMITTED";
}

export function normalizeApplication(application, index = 0) {
    const student = application?.student
        ?? application?.etudiant
        ?? application?.applicant
        ?? application?.etudiantDTO
        ?? {};
    const firstName = application?.firstName ?? application?.prenom ?? student.firstName ?? student.prenom ?? "";
    const lastName = application?.lastName ?? application?.nom ?? student.lastName ?? student.nom ?? "";
    const fullName = application?.name
        ?? application?.studentName
        ?? application?.nomEtudiant
        ?? [firstName, lastName].filter(Boolean).join(" ");
    const documents = Array.isArray(application?.documents) ? application.documents : [];
    const cvDocument = application?.cv ?? application?.resume ?? documents.find((document) => /cv|resume|ré?sumé/i.test(String(document?.type ?? document?.name ?? "")));

    return {
        ...application,
        id: application?.id ?? application?.applicationId ?? `application-${index}`,
        studentId: application?.studentId
            ?? application?.etudiantId
            ?? application?.idEtudiant
            ?? student.id
            ?? null,
        interviewScheduled: Boolean(
            application?.interviewScheduled
            ?? application?.entrevuePlanifiee
            ?? application?.hasInterview
        ),
        firstName,
        lastName,
        name: String(fullName || "").trim(),
        email: application?.email ?? application?.studentEmail ?? application?.courriel ?? student.email ?? "",
        submittedAt: application?.submittedAt
            ?? application?.dateSoumission
            ?? application?.dateApplique
            ?? application?.createdAt
            ?? application?.submissionDate,
        phone: application?.phone ?? application?.telephone ?? student.phone ?? student.telephone ?? "",
        address: application?.address ?? application?.adresse ?? student.address ?? student.adresse ?? "",
        cvDocumentId: application?.cvDocumentId
            ?? application?.cvId
            ?? student.cvDocumentId
            ?? student.cvId
            ?? cvDocument?.id
            ?? null,
        cvFileName: application?.cvFileName
            ?? application?.cvFilename
            ?? student.cvFileName
            ?? student.cvFilename
            ?? cvDocument?.fileName
            ?? cvDocument?.name
            ?? "",
    };
}

export function normalizeOffer(offer) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        statut: normalizeStatus(offer.statut ?? offer.status),
        fileName: offer.fileName ?? offer.filename ?? "",
        nomEntreprise: offer.nomEntreprise ?? offer.companyName ?? offer.company ?? "",
        position: offer.position ?? offer.jobTitle ?? offer.title ?? "",
        descriptionPosition: offer.descriptionPosition ?? offer.description ?? "",
        email: offer.email ?? offer.contactEmail ?? "",
        contactName: offer.contactName ?? offer.contactPerson ?? "",
        contactPhone: offer.contactPhone ?? offer.phone ?? "",
        targetDiscipline: normalizeDiscipline(offer.targetDiscipline ?? offer.discipline),
        dateDebutStage: offer.dateDebutStage ?? offer.startDate ?? "",
        dateFinStage: offer.dateFinStage ?? offer.endDate ?? "",
        adresseEntreprise: offer.adresseEntreprise ?? offer.companyAddress ?? offer.location ?? "",
        salaire: offer.salaire ?? offer.salary ?? "",
        commentaireRejet: offer.commentaireRejet ?? offer.rejectionComment ?? "",
        version: offer.version ?? 1,
    };
}

export function normalizeDiscipline(value) {
    const rawValue = String(value ?? "").trim();
    const normalized = rawValue.toUpperCase().replaceAll(" ", "_").replaceAll("É", "E");
    const match = DISCIPLINES.find(([code, label]) => code === normalized || label.toUpperCase() === rawValue.toUpperCase());
    return match?.[0] ?? rawValue;
}