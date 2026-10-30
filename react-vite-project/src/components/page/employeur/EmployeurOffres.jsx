import React, {useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {createTranslationMessage, translateMessage} from "../../../utils/i18nMessage.js";
import api from "../../../utils/api.js";
import Loading from "../../Loading.jsx";
import ErrorPage from "../../ErrorPage.jsx";
import PdfPreview from "../../PdfPreview.jsx";
import {formatOfferTitle} from "../../componentUtils/offresUtils.js";
import ScheduleInterviewModal from "../../componentUtils/employeur/ScheduleInterviewModal.jsx";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DISCIPLINES = [
    ["INFORMATIQUE", "Informatique"],
    ["INFIRMIERE", "Tech. infirmière"],
    ["ARCHITECTURE", "Architecture"],
    ["ADMINISTRATION", "Administration"],
    ["COMPTABILITE", "Comptabilité"],
    ["EDUCATION", "Éducation"],
    ["GENIE_CIVIL", "Génie civil"],
    ["MARKETING", "Marketing"],
    ["DESIGN_GRAPHIQUE", "Design graphique"],
];

const EMPTY_FORM = {
    nomEntreprise: "",
    contactName: "",
    email: "",
    contactPhone: "",
    position: "",
    targetDiscipline: "",
    adresseEntreprise: "",
    salaire: "",
    dateDebutStage: "",
    dateFinStage: "",
    descriptionPosition: "",
};
const EMPTY_OFFERS = [];
const NEW_OFFER_DRAFT_KEY = "new";

function getTodayIso() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

function sanitizeSalary(value) {
    const sanitized = String(value ?? "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
    const [whole, ...decimalParts] = sanitized.split(".");
    return decimalParts.length > 0 ? `${whole}.${decimalParts.join("")}` : whole;
}

function normalizeStatus(status) {
    const normalized = String(status ?? "").toUpperCase();
    if (["VALIDATED", "VALIDÉ", "VALIDE", "APPROVED", "APPROUVE"].includes(normalized)) return "VALIDE";
    if (["REJECTED", "REJECTE", "REJETÉ", "REJETE"].includes(normalized)) return "REJETE";
    if (["PENDING", "EN_ATTENTE", "EN ATTENTE"].includes(normalized)) return "EN_ATTENTE";
    return "NOT_SUBMITTED";
}

function getApplicationStatus(application) {
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

const INTERNSHIP_FOUND_STATUSES = ["INTERNSHIP_FOUND", "SIGNED_CONTRACT"];

function hasFoundInternship(application) {
    if (getApplicationStatus(application) === "ACCEPTED") return true;
    const studentStatus = String(application?.studentStatus ?? "").toUpperCase();
    return INTERNSHIP_FOUND_STATUSES.includes(studentStatus);
}

function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeApplication(application, index = 0) {
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
        studentStatus: application?.studentStatus
            ?? application?.statutRecherche
            ?? application?.statutEtudiant
            ?? student.statutRecherche
            ?? student.statutStage
            ?? student.statut
            ?? student.status
            ?? "",
        interviewScheduled: String(application?.etatEntrevue ?? "").toUpperCase() !== "PASSEE"
            && application?.interviewInvitationStatus !== "EXPIRED"
            && Boolean(application?.interviewScheduled ?? application?.entrevuePlanifiee ?? application?.hasInterview
                ?? String(application?.etatEntrevue ?? "").toUpperCase() === "PLANIFIEE"),
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

function getApplicationsForOffer(offer) {
    const source = offer?.candidatures ?? offer?.applications ?? offer?.candidates;
    if (Array.isArray(source)) return source.map(normalizeApplication);

    return [];
}

function getApplicationCount(offer) {
    const source = offer?.candidatures ?? offer?.applications ?? offer?.candidates;
    if (Array.isArray(source)) return source.length;
    if (hasValue(offer?.applicationCount ?? offer?.applicationsCount ?? offer?.nombreCandidatures)) {
        return Number(offer.applicationCount ?? offer.applicationsCount ?? offer.nombreCandidatures) || 0;
    }
    return getApplicationsForOffer(offer).length;
}

function normalizeOffer(offer) {
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

function normalizeDiscipline(value) {
    const rawValue = String(value ?? "").trim();
    const normalized = rawValue.toUpperCase().replaceAll(" ", "_").replaceAll("É", "E");
    const match = DISCIPLINES.find(([code, label]) => code === normalized || label.toUpperCase() === rawValue.toUpperCase());
    return match?.[0] ?? rawValue;
}

function formValuesFromOffer(offer, defaultCompanyName = "") {
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

function formatDate(value, language) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function StatusBadge({status}) {
    const {t} = useTranslation();
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
        NOT_SUBMITTED: "border-line bg-canvas text-ink-soft",
    };
    const labels = {
        EN_ATTENTE: t("employerOffers.status.pending"),
        VALIDE: t("employerOffers.status.published"),
        REJETE: t("employerOffers.status.rejected"),
        NOT_SUBMITTED: t("employerOffers.status.draft"),
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] ?? styles.NOT_SUBMITTED}`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>
            {labels[status] ?? status}
        </span>
    );
}

function ApplicationStatusBadge({status}) {
    const {t} = useTranslation();

    if (status === "ACCEPTED") {
        return (
            <span
                className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                {t("employerOffers.applications.status.accepted", "Acceptée")}
            </span>
        );
    }
    if (status === "REJECTED") {
        return (
            <span
                className="inline-flex shrink-0 items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                {t("employerOffers.applications.status.rejected", "Refusée")}
            </span>
        );
    }
    return (
        <span
            className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            {t("employerOffers.applications.status.pending", "En attente")}
        </span>
    );
}

function InternshipFoundBadge() {
    const {t} = useTranslation();

    return (
        <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            <Icon name="check" className="h-3.5 w-3.5"/>
            {t("employerOffers.applications.status.internshipFound", "Stage trouvé")}
        </span>
    );
}

function Icon({name, className = "h-5 w-5"}) {
    const paths = {
        check: <path d="m5 12 4 4L19 6"/>,
        file: <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6M8 13h8M8 17h5"/>
        </>,
        plus: <>
            <path d="M12 5v14M5 12h14"/>
        </>,
        arrow: <>
            <path d="M5 12h14M13 6l6 6-6 6"/>
        </>,
        close: <path d="M6 6l12 12M18 6 6 18"/>,
        shield: <path d="M12 3 4.5 6v5.2c0 4.8 3.2 8.1 7.5 9.8 4.3-1.7 7.5-5 7.5-9.8V6z"/>,
        info: <>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 11v5M12 8h.01"/>
        </>,
        users: <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </>,
        mail: <>
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
        </>,
        calendar: <>
            <rect x="3" y="4.5" width="18" height="17" rx="2"/>
            <path d="M16 2.5v4M8 2.5v4M3 9h18"/>
        </>,
        phone: <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 5.2 2 2 0 0 1 4.11 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 10.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/>,
        chevron: <path d="m9 18 6-6-6-6"/>,
        back: <path d="m15 18-6-6 6-6M9 12h10"/>,
    };

    return (
        <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {paths[name]}
        </svg>
    );
}

function Field({id, label, required = false, error, className = "", children}) {
    const {t} = useTranslation();

    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
                {label} {required && <span className="text-error" aria-hidden="true">*</span>}
            </label>
            {children}
            {error &&
                <p className="mt-1.5 text-xs font-semibold text-error" role="alert">{translateMessage(t, error)}</p>}
        </div>
    );
}

function inputClass(error, disabled = false) {
    return `w-full rounded-xl border bg-canvas px-3.5 py-3 text-sm text-ink outline-none transition focus:border-lavender focus:ring-4 focus:ring-pink/40 ${
        error ? "border-error" : "border-line"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;
}

function initials(name) {
    return String(name ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function ApplicationDocument({icon, label, fileName, documentId, t}) {
    return (
        <div className="rounded-2xl border border-line bg-canvas p-4">
            <div className="flex items-start gap-3">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender/45 text-ink">
                    <Icon name={icon} className="h-5 w-5"/>
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-black text-ink">{label}</p>
                    <p className="mt-1 truncate text-xs text-ink-soft">{fileName || t("employerOffers.applications.documentUnavailable")}</p>
                </div>
            </div>
            {documentId && <PdfPreview documentId={documentId} fileName={fileName} className="mt-4"/>}
        </div>
    );
}

function ApplicationDetails({application, isInterviewScheduled, onBack, onClose, onScheduleInterview, onRefresh}) {
    const {t} = useTranslation();
    const hasContactDetails = application.email || application.phone || application.address;

    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionType, setDecisionType] = useState(null);
    const [rejectionComment, setRejectionComment] = useState("");
    const [commentError, setCommentError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const currentStatus = getApplicationStatus(application);
    const isPending = currentStatus === "PENDING";
    const isAccepted = currentStatus === "ACCEPTED";
    const isRejected = currentStatus === "REJECTED";
    const isInternshipFound = hasFoundInternship(application);
    const shownRejectionComment = application.rejectionComment || application.commentaireRefus || "";

    const handleOpenDecisionModal = (type) => {
        setDecisionType(type);
        setRejectionComment("");
        setCommentError("");
        setServerError(null);
        setShowDecisionModal(true);
    };

    const handleSubmitDecision = async () => {
        setServerError(null);

        if (decisionType === "REJECTED" && !rejectionComment.trim()) {
            setCommentError(t("employerOffers.applications.errors.commentRequired", "Un commentaire expliquant le refus est obligatoire."));
            return;
        }

        setIsSubmitting(true);

        try {
            let response;
            if (decisionType === "ACCEPTED") {
                response = await api.employer.applications.accept(application.id);
            } else {
                response = await api.employer.applications.reject(application.id, rejectionComment);
            }

            if (!response.ok) {
                const raw = await response.text().catch(() => "");
                let message = raw;
                try {
                    const parsed = JSON.parse(raw);
                    message = parsed.messageKey || parsed.message || "";
                } catch {
                }
                console.error("Decision failed", response.status, raw);
                throw new Error(message || "employerOffers.applications.errors.decisionFailed");
            }

            setShowDecisionModal(false);
            setSuccessMessage(
                decisionType === "ACCEPTED"
                    ? t("employerOffers.applications.success.acceptedInternshipFound", "Candidature acceptée. Le statut de l'étudiant est maintenant « Stage trouvé ».")
                    : t("employerOffers.applications.success.rejected", "Candidature refusée avec succès.")
            );

            if (onRefresh) onRefresh();
        } catch (err) {
            setServerError({key: err.message});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="application-detail-title">
                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <button type="button" onClick={onBack}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                    aria-label={t("employerOffers.applications.backToList")}>
                                <Icon name="back" className="h-5 w-5"/>
                            </button>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.applications.detailLabel")}</p>
                                <h2 id="application-detail-title"
                                    className="mt-1 truncate text-xl font-black tracking-tight text-ink sm:text-2xl">{application.name}</h2>
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                aria-label={t("employerOffers.applications.close")}>
                            <Icon name="close" className="h-5 w-5"/>
                        </button>
                    </div>

                    {successMessage && (
                        <div
                            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                            {successMessage}
                        </div>
                    )}

                    <div
                        className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-canvas p-4">
                        <span
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink/55 text-lg font-black text-ink">{initials(application.name || t("employerOffers.applications.unknownStudent"))}</span>
                        <div className="min-w-0">
                            <p className="font-black text-ink">{application.name || t("employerOffers.applications.unknownStudent")}</p>
                            <p className="mt-1 break-all text-sm text-ink-soft">{application.email || t("employerOffers.applications.notSpecified")}</p>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                            {isPending && (
                                <span
                                    className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                                    {t("employerOffers.applications.status.pending", "En attente")}
                                </span>
                            )}
                            {isAccepted && (
                                <span
                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                                    {t("employerOffers.applications.status.accepted", "Acceptée")}
                                </span>
                            )}
                            {isRejected && (
                                <span
                                    className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                                    {t("employerOffers.applications.status.rejected", "Refusée")}
                                </span>
                            )}
                            {isInternshipFound && <InternshipFoundBadge/>}
                            {isInterviewScheduled && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full border border-lavender bg-lavender/35 px-3 py-1 text-xs font-bold text-ink">
                                    <Icon name="calendar" className="h-3.5 w-3.5"/>
                                    {t("employerOffers.interviews.alreadyScheduled", "Entrevue déjà planifiée")}
                                </span>
                            )}
                        </div>
                    </div>

                    {isRejected && shownRejectionComment && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                                {t("employerOffers.applications.rejectionReason", "Raison du refus")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shownRejectionComment}
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
                        <section className="rounded-2xl border border-line bg-surface p-4">
                            <h3 className="text-sm font-black text-ink">{t("employerOffers.applications.contactDetails")}</h3>
                            {hasContactDetails ? <div className="mt-4 space-y-3">
                                    {application.email && <a href={`mailto:${application.email}`}
                                                             className="flex items-start gap-3 text-sm text-ink-soft transition-colors hover:text-ink"><Icon
                                        name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span
                                        className="break-all">{application.email}</span></a>}
                                    {application.phone && <a href={`tel:${application.phone}`}
                                                             className="flex items-start gap-3 text-sm text-ink-soft transition-colors hover:text-ink"><Icon
                                        name="phone"
                                        className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span>{application.phone}</span></a>}
                                    {application.address &&
                                        <p className="flex items-start gap-3 text-sm text-ink-soft"><Icon name="info"
                                                                                                          className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span>{application.address}</span>
                                        </p>}
                                </div> :
                                <p className="mt-3 text-sm text-ink-soft">{t("employerOffers.applications.notSpecified")}</p>}
                        </section>
                    </div>

                    <section className="mt-5">
                        <h3 className="text-sm font-black text-ink">{t("employerOffers.applications.documentsTitle")}</h3>
                        <div className="mt-3">
                            <ApplicationDocument icon="file" label={t("employerOffers.applications.cv")}
                                                 fileName={application.cvFileName} documentId={application.cvDocumentId}
                                                 t={t}/>
                        </div>
                    </section>

                    <div className="mt-8 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
                                    {t("employerOffers.applications.actionsTitle", "Actions")}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink-soft">
                                    {isPending
                                        ? isInterviewScheduled
                                            ? t("employerOffers.applications.actionsAfterInterview", "Entrevue planifiée. Vous pouvez maintenant accepter ou refuser la candidature.")
                                            : t("employerOffers.applications.actionsDescription", "Planifiez une entrevue avant de pouvoir accepter la candidature.")
                                        : t("employerOffers.applications.readOnlyNotice", "Décision déjà enregistrée.")}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            {isPending && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenDecisionModal("REJECTED")}
                                    className="rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t("employerOffers.applications.reject", "Refuser")}
                                </button>
                            )}

                            {isInterviewScheduled ? (
                                isPending && (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDecisionModal("ACCEPTED")}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50"
                                    >
                                        {t("employerOffers.applications.accept", "Accepter")}
                                    </button>
                                )
                            ) : (
                                <button
                                    type="button"
                                    disabled={!isPending}
                                    title={!isPending
                                        ? t("employerOffers.interviews.disabledAfterDecision", "Une décision a déjà été prise pour cette candidature.")
                                        : undefined}
                                    onClick={() => {
                                        if (!isPending) return;
                                        onScheduleInterview({
                                            ...application,
                                            id: application.studentId,
                                        });
                                    }}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                                        isPending
                                            ? "bg-ink text-white hover:bg-ink-soft"
                                            : "bg-line text-ink-soft"
                                    }`}
                                >
                                    <Icon name="calendar" className="h-4 w-4"/>
                                    {t("employerOffers.interviews.title", "Planifier une entrevue")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDecisionModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-black text-ink">
                            {decisionType === "ACCEPTED"
                                ? t("employerOffers.applications.confirmAcceptTitle", "Accepter la candidature")
                                : t("employerOffers.applications.confirmRejectTitle", "Refuser la candidature")}
                        </h3>

                        <p className="text-sm text-ink-soft">
                            {decisionType === "ACCEPTED"
                                ? t("employerOffers.applications.confirmAcceptInternshipDesc", "Souhaitez-vous vraiment accepter cette candidature ? L'étudiant sera notifié et son statut deviendra « Stage trouvé ».")
                                : t("employerOffers.applications.confirmRejectDesc", "Veuillez expliquer les raisons du refus. Ce commentaire sera transmis à l'étudiant.")}
                        </p>

                        {serverError && (
                            <div
                                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                                {translateMessage(t, serverError)}
                            </div>
                        )}

                        {decisionType === "REJECTED" && (
                            <div>
                                <label className="block text-xs font-bold text-ink mb-1">
                                    {t("employerOffers.applications.commentLabel", "Raison du refus *")}
                                </label>
                                <textarea
                                    rows="3"
                                    value={rejectionComment}
                                    onChange={(e) => {
                                        setRejectionComment(e.target.value);
                                        if (commentError) setCommentError("");
                                    }}
                                    placeholder={t("employerOffers.applications.commentPlaceholder", "Saisissez les raisons du refus...")}
                                    className="w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink outline-none focus:border-lavender resize-none"
                                />
                                {commentError &&
                                    <p className="mt-1 text-xs font-semibold text-rose-600">{commentError}</p>}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowDecisionModal(false)}
                                className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-canvas"
                            >
                                {t("common.cancel", "Annuler")}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleSubmitDecision}
                                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors ${
                                    decisionType === "ACCEPTED" ? "bg-ink hover:ink-soft" : "bg-rose-600 hover:bg-rose-700"
                                } disabled:opacity-50`}
                            >
                                {isSubmitting ? t("common.saving", "Traitement...") : t("common.confirm", "Confirmer")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ApplicationsModal({offer, applications, language, onClose, isLoading, error, onScheduleInterview, onRefresh}) {
    const {t} = useTranslation();
    const [selectedApplication, setSelectedApplication] = useState(null);

    const currentApplication = selectedApplication
        ? applications.find((application) => application.id === selectedApplication.id) ?? selectedApplication
        : null;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                if (selectedApplication) setSelectedApplication(null);
                else onClose();
            }
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose, selectedApplication]);

    if (currentApplication) {
        return (
            <ApplicationDetails
                application={currentApplication}
                isInterviewScheduled={Boolean(currentApplication.interviewScheduled)}
                onBack={() => setSelectedApplication(null)}
                onClose={onClose}
                onScheduleInterview={onScheduleInterview}
                onRefresh={onRefresh}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="applications-title">
                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.applications.label")}</p>
                                <span
                                    className="rounded-full bg-pink/55 px-2.5 py-1 text-xs font-black text-ink">{applications.length}</span>
                            </div>
                            <h2 id="applications-title"
                                className="mt-2 text-2xl font-black tracking-tight text-ink">{t("employerOffers.applications.title")}</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">{formatOfferTitle(offer.position) || t("employerOffers.untitledOffer")}</p>
                        </div>
                        <button type="button" onClick={onClose}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                aria-label={t("employerOffers.applications.close")}>
                            <Icon name="close" className="h-5 w-5"/>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="mt-6 rounded-2xl border border-line bg-canvas px-5 py-12 text-center">
                            <Loading/>
                        </div>
                    ) : error ? (
                        <div className="mt-6 rounded-2xl border border-error bg-blush/30 px-5 py-12 text-center">
                            <p className="text-base font-black text-error">{t("employerOffers.errors.loadFailed")}</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div
                            className="mt-6 rounded-2xl border border-dashed border-line bg-canvas px-5 py-12 text-center">
                            <p className="text-base font-black text-ink">{t("employerOffers.applications.emptyTitle")}</p>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">{t("employerOffers.applications.emptyDescription")}</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {applications.map((application) => (
                                <button key={application.id} type="button"
                                        onClick={() => setSelectedApplication(application)}
                                        className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-canvas p-4 text-left transition-colors hover:border-lavender hover:bg-lavender/15 focus:outline-none focus:ring-4 focus:ring-pink/40">
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink/55 text-sm font-black text-ink">{initials(application.name || t("employerOffers.applications.unknownStudent"))}</span>
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className="block truncate text-sm font-black text-ink">{application.name || t("employerOffers.applications.unknownStudent")}</span>
                                        <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-soft"><Icon
                                            name="mail"
                                            className="h-3.5 w-3.5 shrink-0"/>{application.email || t("employerOffers.applications.notSpecified")}</span>
                                        <span
                                            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft sm:hidden"><Icon
                                            name="calendar"
                                            className="h-3.5 w-3.5 shrink-0"/>{formatDate(application.submittedAt, language) || t("employerOffers.applications.notSpecified")}</span>
                                    </span>
                                    <span
                                        className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-soft sm:flex"><Icon
                                        name="calendar"
                                        className="h-3.5 w-3.5"/>{formatDate(application.submittedAt, language) || t("employerOffers.applications.notSpecified")}</span>
                                    <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                        <ApplicationStatusBadge status={getApplicationStatus(application)}/>
                                        {hasFoundInternship(application) && <InternshipFoundBadge/>}
                                        {application.interviewScheduled && (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full border border-lavender bg-lavender/35 px-3 py-1 text-xs font-bold text-ink">
                                                <Icon name="calendar" className="h-3.5 w-3.5"/>
                                                {t("employerOffers.interviews.alreadyScheduled", "Entrevue déjà planifiée")}
                                            </span>
                                        )}
                                    </span>
                                    <Icon name="chevron"
                                          className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"/>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function EmployeurOffres({
                                            offers,
                                            isAccountEmailValidated = true,
                                            canManageOffers = true,
                                            onSubmit,
                                            user,
                                            companyName = "",
                                            drafts: externalDrafts,
                                            setDrafts: setExternalDrafts,
                                            workspaceTabs,
                                            embedded = false,
                                        }) {
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const editorScrollRef = useRef(null);
    const {t, i18n} = useTranslation();
    const employerCompanyName = String(
        user?.nomCompagnie
        || user?.nomEntreprise
        || user?.companyName
        || user?.entreprise
        || companyName
    ).trim();
    const usesRemoteOffers = offers === undefined;
    const [remoteOffers, setRemoteOffers] = useState(null);
    const [isLoadingOffers, setIsLoadingOffers] = useState(usesRemoteOffers);
    const [loadError, setLoadError] = useState(null);
    const displayedOffers = usesRemoteOffers ? (remoteOffers ?? EMPTY_OFFERS) : offers;
    const initialOffers = useMemo(() => (
        (displayedOffers ?? []).map(normalizeOffer)
    ), [displayedOffers]);
    const [offerList, setOfferList] = useState(initialOffers);
    const [selectedId, setSelectedId] = useState(null);
    const [formValues, setFormValues] = useState(() => formValuesFromOffer(initialOffers[0], employerCompanyName));
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewOffer, setIsNewOffer] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
    const [applicationsOffer, setApplicationsOffer] = useState(null);
    const [applicationsByOffer, setApplicationsByOffer] = useState({});
    const [isLoadingApplications, setIsLoadingApplications] = useState(false);
    const [applicationsError, setApplicationsError] = useState("");
    const [isFileCleared, setIsFileCleared] = useState(false);
    const [localDrafts, setLocalDrafts] = useState({});
    const [interviewCandidate, setInterviewCandidate] = useState(null);
    const [interviewOfferId, setInterviewOfferId] = useState(null);
    const drafts = externalDrafts ?? localDrafts;
    const saveDrafts = setExternalDrafts ?? setLocalDrafts;

    const selectedOffer = offerList.find((offer) => offer.id === selectedId) ?? null;
    const isOfferReadOnly = !canManageOffers;
    const pendingCount = offerList.filter((offer) => offer.statut === "EN_ATTENTE").length;
    const publishedCount = offerList.filter((offer) => offer.statut === "VALIDE").length;
    const minimumStageDate = getTodayIso();
    const editorTitleKey = isNewOffer
        ? "employerOffers.editor.newTitle"
        : selectedOffer?.statut === "REJETE"
            ? "employerOffers.editor.rejectedTitle"
            : selectedOffer?.statut === "EN_ATTENTE"
                ? "employerOffers.editor.pendingTitle"
                : selectedOffer?.statut === "VALIDE"
                    ? "employerOffers.editor.updateTitle"
                    : "employerOffers.editor.editTitle";

    useEffect(() => {
        if (!isEditorOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape" && !isSubmitting) {
                event.preventDefault();
                setIsEditorOpen(false);
            }
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isEditorOpen, isSubmitting]);

    useEffect(() => {
        if (!usesRemoteOffers) return undefined;

        let isMounted = true;
        api.employer.offers.list()
            .then(async (response) => {
                if (!response.ok) {
                    const error = errorForOfferStatus(response.status);
                    error.status = response.status;
                    throw error;
                }
                const data = await response.json();
                if (isMounted) setRemoteOffers(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                if (isMounted) {
                    setLoadError(error?.key ? error : createTranslationMessage("employerOffers.errors.loadFailed"));
                }
            })
            .finally(() => {
                if (isMounted) setIsLoadingOffers(false);
            });

        return () => {
            isMounted = false;
        };
    }, [usesRemoteOffers]);

    useEffect(() => {
        setOfferList(initialOffers);
        if (isNewOffer) return;

        const selectedOfferStillExists = selectedId !== null
            && initialOffers.some((offer) => offer.id === selectedId);
        if (selectedId !== null && !selectedOfferStillExists) {
            setSelectedId(null);
            setFormValues(formValuesFromOffer(null, employerCompanyName));
            setIsFileCleared(false);
        }
    }, [initialOffers, employerCompanyName]);

    useEffect(() => {
        if (!isNewOffer) {
            const draft = drafts[String(selectedId)];
            setFormValues(draft?.fields ?? formValuesFromOffer(selectedOffer, employerCompanyName));
            setSelectedFile(draft?.file ?? null);
            setIsFileCleared(draft?.fileCleared ?? false);
            setFieldErrors({});
            setFileError("");
            setFormError("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [selectedId, isNewOffer, employerCompanyName, drafts]);

    const fetchApplications = async (offerId) => {
        const response = await api.employer.applications.list(offerId);
        if (!response.ok) throw new Error("applications_request_failed");

        const data = await response.json();
        setApplicationsByOffer((current) => ({
            ...current,
            [String(offerId)]: Array.isArray(data) ? data.map(normalizeApplication) : [],
        }));
    };

    const loadApplications = async (offer) => {
        if (!offer?.id) return;

        setApplicationsOffer(offer);
        setIsApplicationsOpen(true);
        setIsLoadingApplications(true);
        setApplicationsError("");

        try {
            await fetchApplications(offer.id);
        } catch {
            setApplicationsError("applications_request_failed");
        } finally {
            setIsLoadingApplications(false);
        }
    };

    useEffect(() => {
        if (!usesRemoteOffers) return undefined;

        const validatedOffers = offerList.filter((offer) => offer.statut === "VALIDE");
        if (validatedOffers.length === 0) return undefined;

        let isMounted = true;

        Promise.all(validatedOffers.map(async (offer) => {
            try {
                const response = await api.employer.applications.list(offer.id);
                if (!response.ok) return null;

                const data = await response.json();
                return [String(offer.id), Array.isArray(data) ? data.map(normalizeApplication) : []];
            } catch {
                return null;
            }
        })).then((entries) => {
            if (!isMounted) return;

            const loadedApplications = Object.fromEntries(entries.filter(Boolean));
            setApplicationsByOffer((current) => ({...current, ...loadedApplications}));
        });

        return () => {
            isMounted = false;
        };
    }, [offerList, usesRemoteOffers]);

    const selectOffer = (offer) => {
        const draft = drafts[String(offer.id)];
        setIsNewOffer(false);
        setSelectedId(offer.id);
        setIsApplicationsOpen(false);
        setApplicationsOffer(null);
        setIsEditorOpen(true);
        setIsFileCleared(draft?.fileCleared ?? false);
        setFormValues(draft?.fields ?? formValuesFromOffer(offer, employerCompanyName));
        setSelectedFile(draft?.file ?? null);
        setFieldErrors({});
        setFileError("");
        setFormError("");
        setSuccessMessage("");
        window.requestAnimationFrame(() => formRef.current?.scrollIntoView({behavior: "smooth", block: "start"}));
    };

    const startNewOffer = () => {
        const draft = drafts[NEW_OFFER_DRAFT_KEY];
        const draftFields = draft?.fields ?? EMPTY_FORM;
        setIsNewOffer(true);
        setSelectedId(null);
        setIsApplicationsOpen(false);
        setIsEditorOpen(true);
        setIsFileCleared(false);
        setFormValues({
            ...draftFields,
            nomEntreprise: employerCompanyName || draftFields.nomEntreprise || "",
        });
        setSelectedFile(draft?.file ?? null);
        setFieldErrors({});
        setFileError("");
        setFormError("");
        setSuccessMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        window.requestAnimationFrame(() => formRef.current?.scrollIntoView({behavior: "smooth", block: "start"}));
    };

    const updateField = (event) => {
        const {name, value} = event.target;
        const nextValue = name === "salaire" ? sanitizeSalary(value) : value;
        const nextValues = {...formValues, [name]: nextValue};
        const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
        setFormValues(nextValues);
        saveDrafts((current) => ({
            ...current,
            [draftKey]: {fields: nextValues, file: selectedFile, fileCleared: isFileCleared},
        }));
        setFieldErrors((current) => ({...current, [name]: ""}));
        setFormError("");
        setSuccessMessage("");
    };

    const validateFile = (file) => {
        setFileError("");
        setFormError("");
        setSuccessMessage("");
        if (!file) return false;

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            setFileError("employerOffers.errors.invalidFormat");
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            setFileError("employerOffers.errors.fileTooLarge");
            return false;
        }
        setSelectedFile(file);
        setIsFileCleared(false);
        const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
        saveDrafts((current) => ({
            ...current,
            [draftKey]: {fields: formValues, file, fileCleared: false},
        }));
        return true;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!validateFile(file)) {
            setSelectedFile(null);
            setIsFileCleared(true);
            const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
            saveDrafts((current) => ({
                ...current,
                [draftKey]: {fields: formValues, file: null, fileCleared: true},
            }));
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!isAccountEmailValidated || isOfferReadOnly) return;
        const file = event.dataTransfer.files?.[0];
        if (!validateFile(file)) {
            setSelectedFile(null);
            setIsFileCleared(true);
            const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
            saveDrafts((current) => ({
                ...current,
                [draftKey]: {fields: formValues, file: null, fileCleared: true},
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        const companyNameForOffer = employerCompanyName || String(formValues.nomEntreprise ?? "").trim();
        const requiredFields = {
            nomEntreprise: "employerOffers.errors.companyRequired",
            position: "employerOffers.errors.positionRequired",
            targetDiscipline: "employerOffers.errors.disciplineRequired",
            adresseEntreprise: "employerOffers.errors.addressRequired",
            dateDebutStage: "employerOffers.errors.startDateRequired",
            dateFinStage: "employerOffers.errors.endDateRequired",
            descriptionPosition: "employerOffers.errors.descriptionRequired",
        };

        Object.entries(requiredFields).forEach(([field, message]) => {
            const value = field === "nomEntreprise" ? companyNameForOffer : formValues[field];
            if (!String(value ?? "").trim()) errors[field] = message;
        });
        if (formValues.email && !/^\S+@\S+\.\S+$/.test(formValues.email)) {
            errors.email = "employerOffers.errors.invalidEmail";
        }
        if (formValues.salaire && !/^\d+(\.\d+)?$/.test(formValues.salaire)) {
            errors.salaire = "employerOffers.errors.invalidSalary";
        }
        if (formValues.dateDebutStage && formValues.dateDebutStage < minimumStageDate) {
            errors.dateDebutStage = "employerOffers.errors.startDateInPast";
        }
        if (formValues.dateFinStage && formValues.dateFinStage < minimumStageDate) {
            errors.dateFinStage = "employerOffers.errors.endDateInPast";
        }
        if (formValues.dateDebutStage && formValues.dateFinStage && formValues.dateFinStage < formValues.dateDebutStage) {
            errors.dateFinStage = "employerOffers.errors.endDateAfterStart";
        }
        if (formValues.descriptionPosition.trim().length > 0 && formValues.descriptionPosition.trim().length < 40) {
            errors.descriptionPosition = "employerOffers.errors.descriptionTooShort";
        }
        setFieldErrors(errors);
        if (errors.nomEntreprise) {
            setFormError(errors.nomEntreprise);
        }
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");
        setFormError("");

        if (!isAccountEmailValidated) {
            setFormError("employerOffers.errors.accountNotValidated");
            return;
        }
        if (isOfferReadOnly) {
            setFormError("employerOffers.viewerReadOnlyMessage");
            return;
        }
        const hasExistingFile = !isNewOffer && Boolean(selectedOffer?.fileName) && !isFileCleared;
        if (!selectedFile && !hasExistingFile) {
            setFileError("employerOffers.errors.fileRequired");
        }
        if (!validateForm() || (!selectedFile && !hasExistingFile)) return;

        setIsSubmitting(true);
        const formData = buildOfferSubmissionFormData({
            file: selectedFile,
            fields: {...formValues, nomEntreprise: employerCompanyName || formValues.nomEntreprise},
            offerId: selectedOffer?.id,
        });

        try {
            const submitOffer = onSubmit ?? (async ({offerId, mode, formData}) => {
                const response = mode === "update"
                    ? await api.employer.offers.update(offerId, formData)
                    : await api.employer.offers.create(formData);

                if (!response.ok) return {response};

                const offer = await response.json();
                return {response, offer};
            });

            const result = await submitOffer({
                offerId: selectedOffer?.id ?? null,
                mode: isNewOffer ? "create" : "update",
                fields: {...formValues, nomEntreprise: employerCompanyName || formValues.nomEntreprise},
                file: selectedFile,
                formData,
            });
            const response = result?.response ?? result;
            if (response?.status === 403) {
                setFormError("employerOffers.errors.accountMustBeValidated");
                return;
            }
            if (response?.ok === false) {
                throw createTranslationMessage("employerOffers.errors.submissionFailed");
            }

            if (!result?.offer) {
                throw createTranslationMessage("employerOffers.errors.submissionFailed");
            }
            const submittedOffer = normalizeOffer(result.offer);
            const submittedDraftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedOffer?.id ?? selectedId);
            setOfferList((current) => {
                const exists = current.some((offer) => offer.id === submittedOffer.id);
                return exists
                    ? current.map((offer) => offer.id === submittedOffer.id ? submittedOffer : offer)
                    : [submittedOffer, ...current];
            });
            setSelectedId(submittedOffer.id);
            setIsNewOffer(false);
            setIsFileCleared(false);
            setSelectedFile(null);
            setFormValues(formValuesFromOffer(submittedOffer, employerCompanyName));
            saveDrafts((current) => {
                const nextDrafts = {...current};
                delete nextDrafts[submittedDraftKey];
                return nextDrafts;
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSuccessMessage(isNewOffer
                ? "employerOffers.success.created"
                : "employerOffers.success.updated");
        } catch (error) {
            setFormError(error?.key || "employerOffers.errors.submissionConnection");
        } finally {
            window.requestAnimationFrame(() => editorScrollRef.current?.scrollTo({top: 0, behavior: "smooth"}));
            setIsSubmitting(false);
        }
    };

    const handleEditorBackdropMouseDown = (event) => {
        if (event.target === event.currentTarget && !isSubmitting) setIsEditorOpen(false);
    };

    const closeEditor = () => {
        if (!isSubmitting) setIsEditorOpen(false);
    };

    const clearForm = () => {
        const clearedValues = {...EMPTY_FORM, nomEntreprise: employerCompanyName};
        const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);

        setFormValues(clearedValues);
        setSelectedFile(null);
        setIsFileCleared(true);
        setFieldErrors({});
        setFileError("");
        setFormError("");
        setSuccessMessage("");
        setIsDragging(false);
        saveDrafts((current) => ({
            ...current,
            [draftKey]: {fields: clearedValues, file: null, fileCleared: true},
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isLoadingOffers) return <Loading/>;
    if (loadError) return <ErrorPage error={loadError}/>;

    return (
        <section className={embedded ? "bg-canvas" : "flex-1 bg-canvas px-4 py-6 sm:px-6 sm:py-8 lg:px-8"}>
            <div className="mx-auto w-full max-w-7xl">
                {!embedded && <div>
                    <span
                        className="inline-flex w-fit rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("employerHome.eyebrow")}
                    </span>
                    <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-ink sm:text-3xl">{t("employerOffers.title")}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">{t("employerOffers.description")}</p>
                </div>}

                {!embedded && workspaceTabs}

                {!isAccountEmailValidated && (
                    <div
                        className="mt-5 flex items-start gap-3 rounded-2xl border border-peach bg-peach/45 p-3.5 sm:p-4"
                        role="alert">
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface/80 text-ink"><Icon
                            name="shield" className="h-4 w-4"/></span>
                        <div>
                            <p className="text-sm font-black text-ink">{t("employerOffers.accountBlockedTitle")}</p>
                            <p className="mt-1 text-sm leading-6 text-ink-soft">{t("employerOffers.accountBlockedDescription")}</p>
                        </div>
                    </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_6px_18px_rgba(48,35,55,0.04)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{t("employerOffers.stats.myOffers")}</p>
                        <p className="text-xl font-black text-ink">{offerList.length}</p>
                    </div>
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_6px_18px_rgba(48,35,55,0.04)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{t("employerOffers.stats.pending")}</p>
                        <p className="text-xl font-black text-ink">{pendingCount}</p>
                    </div>
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_6px_18px_rgba(48,35,55,0.04)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{t("employerOffers.stats.published")}</p>
                        <p className="text-xl font-black text-ink">{publishedCount}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <aside
                        className="rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6">
                        <div className="rounded-2xl border border-line bg-canvas p-3 sm:p-4">
                            <div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.workspace")}</p>
                                    <h2 className="text-xl font-black tracking-tight text-ink">{t("employerOffers.myOffersTitle")}</h2>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="min-w-0 flex-1 text-sm leading-6 text-ink-soft">{t("employerOffers.selectOfferDescription")}</p>
                                {canManageOffers && <button type="button" onClick={startNewOffer}
                                                            className="inline-flex w-fit flex-none items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-bold whitespace-nowrap text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/40">
                                    <Icon name="plus" className="h-3.5 w-3.5"/> {t("employerOffers.newOffer")}
                                </button>}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {offerList.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-line bg-canvas p-5 text-center">
                                    <p className="mt-0 text-sm font-bold text-ink">{t("employerOffers.emptyTitle")}</p>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">{t("employerOffers.emptyDescription")}</p>
                                </div>
                            )}
                            {offerList.map((offer) => {
                                const applicationCount = applicationsByOffer[String(offer.id)]?.length
                                    ?? getApplicationCount(offer);
                                const hasApplications = applicationCount > 0;

                                return <div
                                    key={offer.id}
                                    className={`flex h-full w-full flex-col rounded-2xl border p-4 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${selectedId === offer.id && !isNewOffer ? "border-ink bg-lavender/30" : "border-line bg-canvas hover:border-lavender hover:bg-lavender/15"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-black leading-5 text-ink">{formatOfferTitle(offer.position) || t("employerOffers.untitledOffer")}</p>
                                            <p className="mt-1 truncate text-xs text-ink-soft">{offer.fileName || t("employerOffers.noFile")}</p>
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-bold text-ink-soft">
                                                <Icon name="users" className="h-3.5 w-3.5"/>
                                                {applicationCount}
                                            </span>
                                            <StatusBadge status={offer.statut}/>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
                                        <Icon name="calendar" className="h-3.5 w-3.5"/>
                                        <span>{formatDate(offer.updatedAt, i18n.resolvedLanguage)}</span>
                                    </div>
                                    <div
                                        className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
                                        {canManageOffers && <button type="button" onClick={() => selectOffer(offer)}
                                                                    className="inline-flex min-w-0 items-center gap-1.5 rounded-lg px-1 py-2 text-xs font-bold text-ink-soft transition-colors hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40">
                                            <Icon name="file" className="h-3.5 w-3.5 shrink-0"/>
                                            {t("employerOffers.actions.update")}
                                        </button>}
                                        {offer.statut === "VALIDE" && <div className="ml-auto flex items-center gap-2">
                                            {hasApplications ? (
                                                <button
                                                    type="button"
                                                    onClick={() => loadApplications(offer)}
                                                    className="inline-flex w-fit flex-none items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/40"
                                                >
                                                    <Icon name="users" className="h-3.5 w-3.5 shrink-0"/>
                                                    {t("employerOffers.actions.applications")}
                                                </button>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-line px-3 py-2.5 text-xs font-bold text-ink-soft">
                                                    <Icon name="users" className="h-3.5 w-3.5 shrink-0"/>
                                                    {t("employerOffers.actions.noApplications", "Aucune candidature")}
                                                </span>
                                            )}
                                        </div>}
                                    </div>
                                </div>;
                            })}
                        </div>
                    </aside>

                    {isEditorOpen && <div
                        className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/70 p-3 backdrop-blur-sm sm:p-6 lg:items-center"
                        onMouseDown={handleEditorBackdropMouseDown}
                    >
                        <div ref={formRef}
                             className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)]"
                             role="dialog"
                             aria-modal="true"
                             aria-labelledby="employer-offer-editor-title">
                            <div ref={editorScrollRef} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                                <div
                                    className="flex flex-row items-start justify-between gap-3 border-b border-line pb-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.editor.label")}</p>
                                            {!isNewOffer && selectedOffer &&
                                                <StatusBadge status={selectedOffer.statut}/>}
                                        </div>
                                        <h2 id="employer-offer-editor-title"
                                            className="mt-3 text-2xl font-black tracking-tight text-ink">{t(editorTitleKey)}</h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{isOfferReadOnly
                                            ? selectedOffer?.statut === "EN_ATTENTE"
                                                ? t("employerOffers.editor.pendingDescription")
                                                : t("employerOffers.editor.rejectedDescription")
                                            : t("employerOffers.editor.newDescription")}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeEditor}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label={t("employerOffers.closeModal")}
                                        disabled={isSubmitting}
                                    >
                                        <Icon name="close" className="h-5 w-5"/>
                                    </button>
                                </div>

                                {selectedOffer?.statut === "REJETE" && selectedOffer.commentaireRejet && (
                                    <div
                                        className="mt-6 flex items-start gap-3 rounded-2xl border border-blush bg-blush/30 p-4"
                                        role="status">
                                <span
                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-error"><Icon
                                    name="info" className="h-4 w-4"/></span>
                                        <div>
                                            <p className="text-sm font-black text-ink">{t("employerOffers.rejectionComment")}</p>
                                            <p className="mt-1 text-sm leading-6 text-ink-soft">{selectedOffer.commentaireRejet}</p>
                                        </div>
                                    </div>
                                )}

                                {successMessage && <div
                                    className="mt-6 flex items-start gap-3 rounded-2xl border border-[#9ed9bd] bg-[#dff6e8] p-4 text-sm text-[#245e3b]"
                                    role="status" aria-live="polite"><Icon name="check"
                                                                           className="mt-0.5 h-5 w-5 shrink-0"/><p
                                    className="font-semibold">{translateMessage(t, successMessage)}</p></div>}
                                {formError && <div
                                    className="mt-6 rounded-2xl border border-error bg-blush/25 p-4 text-sm font-semibold text-error"
                                    role="alert">{translateMessage(t, formError)}</div>}

                                <form className="mt-7 space-y-8" onSubmit={handleSubmit} noValidate>
                                    <fieldset disabled={!isAccountEmailValidated || isSubmitting || isOfferReadOnly}
                                              className="space-y-8">
                                        <div>
                                            <div
                                                className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <h3 className="text-lg font-black text-ink">{t("employerOffers.fileStepTitle")}</h3>
                                                    <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.fileStepDescription")}</p>
                                                </div>
                                            </div>
                                            {isOfferReadOnly ? (
                                                <div
                                                    className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-3.5"
                                                    role="status">
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender/50 text-ink"><Icon
                                                name="file" className="h-5 w-5"/></span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t("employerOffers.submittedDocument")}</p>
                                                        <p className="mt-1 truncate text-sm font-bold text-ink">{selectedOffer?.fileName || t("employerOffers.noFile")}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`mt-4 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-pink bg-pink/25" : fileError ? "border-error bg-blush/15" : "border-line bg-canvas hover:border-lavender"}`}
                                                    onDragOver={(event) => {
                                                        event.preventDefault();
                                                        if (!isAccountEmailValidated) return;
                                                        setIsDragging(true);
                                                    }}
                                                    onDragLeave={(event) => {
                                                        event.preventDefault();
                                                        setIsDragging(false);
                                                    }}
                                                    onDrop={handleDrop}
                                                >
                                                    <input ref={fileInputRef} id="offer-file" type="file"
                                                           accept="application/pdf,.pdf" onChange={handleFileChange}
                                                           className="sr-only"/>
                                                    <label htmlFor="offer-file"
                                                           className="cursor-pointer text-sm font-bold text-ink underline decoration-pink decoration-4 underline-offset-4">
                                                        {t("studentCv.chooseFile")}
                                                    </label>
                                                    <p className="mt-2 text-sm text-ink-soft">{t("studentCv.dropFile")}</p>
                                                    <p className="mt-1 text-xs text-ink-soft">{t("studentCv.maximumSize")}</p>
                                                    {selectedFile && <p
                                                        className="mt-4 rounded-xl bg-lavender/45 px-3 py-2 text-sm font-semibold text-ink"
                                                        role="status">{selectedFile.name}</p>}
                                                    {!selectedFile && !isFileCleared && selectedOffer?.fileName && <div
                                                        className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink-soft">
                                                        <Icon name="file" className="h-4 w-4 shrink-0"/><span
                                                        className="truncate">{t("employerOffers.currentFile")} <strong
                                                        className="text-ink">{selectedOffer.fileName}</strong></span>
                                                    </div>}
                                                </div>
                                            )}
                                            {(selectedFile || (!isFileCleared && selectedOffer?.fileName)) &&
                                                <PdfPreview
                                                    file={selectedFile}
                                                    documentId={!selectedFile && !isFileCleared ? selectedOffer?.id : null}
                                                    fileName={selectedFile?.name || (!isFileCleared && selectedOffer?.fileName)}
                                                    className="mt-5"
                                                />}
                                            {fileError && <p className="mt-2 text-sm font-semibold text-error"
                                                             role="alert">{translateMessage(t, fileError)}</p>}
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-black text-ink">{t("employerOffers.detailsStepTitle")}</h3>
                                            <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.detailsStepDescription")}</p>
                                            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                                <Field id="position" label={t("employerOffers.fields.position")}
                                                       required
                                                       error={fieldErrors.position}>
                                                    <input id="position" name="position" value={formValues.position}
                                                           onChange={updateField}
                                                           className={inputClass(fieldErrors.position)}
                                                           placeholder={t("employerOffers.placeholders.position")}/>
                                                </Field>
                                                <Field id="targetDiscipline"
                                                       label={t("employerOffers.fields.discipline")}
                                                       required
                                                       error={fieldErrors.targetDiscipline}>
                                                    <select id="targetDiscipline" name="targetDiscipline"
                                                            value={formValues.targetDiscipline} onChange={updateField}
                                                            className={inputClass(fieldErrors.targetDiscipline)}>
                                                        <option
                                                            value="">{t("employerOffers.fields.selectDiscipline")}</option>
                                                        {DISCIPLINES.map(([value]) => <option key={value}
                                                                                              value={value}>{t(`employerOffers.disciplines.${value}`)}</option>)}
                                                    </select>
                                                </Field>
                                                <Field id="adresseEntreprise"
                                                       label={t("employerOffers.fields.companyAddress")}
                                                       required
                                                       error={fieldErrors.adresseEntreprise}>
                                                    <input id="adresseEntreprise" name="adresseEntreprise"
                                                           value={formValues.adresseEntreprise} onChange={updateField}
                                                           className={inputClass(fieldErrors.adresseEntreprise)}
                                                           placeholder={t("employerOffers.placeholders.companyAddress")}/>
                                                </Field>
                                                <Field id="dateDebutStage" label={t("employerOffers.fields.startDate")}
                                                       required
                                                       error={fieldErrors.dateDebutStage}>
                                                    <input id="dateDebutStage" type="date" name="dateDebutStage"
                                                           min={minimumStageDate}
                                                           value={formValues.dateDebutStage} onChange={updateField}
                                                           className={inputClass(fieldErrors.dateDebutStage)}/>
                                                </Field>
                                                <Field id="dateFinStage" label={t("employerOffers.fields.endDate")}
                                                       required
                                                       error={fieldErrors.dateFinStage}>
                                                    <input id="dateFinStage" type="date" name="dateFinStage"
                                                           min={formValues.dateDebutStage || minimumStageDate}
                                                           value={formValues.dateFinStage} onChange={updateField}
                                                           className={inputClass(fieldErrors.dateFinStage)}/>
                                                </Field>
                                                <Field id="salaire" label={t("employerOffers.fields.hourlyPay")}
                                                       error={fieldErrors.salaire}>
                                                    <div className="relative"><input id="salaire" type="text"
                                                                                     inputMode="decimal"
                                                                                     pattern="[0-9]*([.,][0-9]+)?"
                                                                                     name="salaire"
                                                                                     value={formValues.salaire}
                                                                                     onChange={updateField}
                                                                                     className={`${inputClass(fieldErrors.salaire)} pr-12`}
                                                                                     placeholder={t("employerOffers.placeholders.hourlyPay")}/><span
                                                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-soft">{t("employerOffers.units.hourlyRate")}</span>
                                                    </div>
                                                </Field>
                                            </div>
                                            <Field id="descriptionPosition"
                                                   label={t("employerOffers.fields.description")}
                                                   required
                                                   error={fieldErrors.descriptionPosition} className="mt-5">
                                        <textarea id="descriptionPosition" name="descriptionPosition" rows="4"
                                                  value={formValues.descriptionPosition} onChange={updateField}
                                                  className={`${inputClass(fieldErrors.descriptionPosition)} resize-y`}
                                                  placeholder={t("employerOffers.placeholders.description")}/>
                                                <p className="mt-1.5 text-right text-xs text-ink-soft">{t("employerOffers.characterCount", {count: formValues.descriptionPosition.length})}</p>
                                            </Field>
                                        </div>

                                    </fieldset>

                                    <div
                                        className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                                        {isOfferReadOnly ? (
                                            <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
                                                <Icon
                                                    name="info"
                                                    className="mt-0.5 h-4 w-4 shrink-0"/>{canManageOffers
                                                ? t("employerOffers.readOnlyMessage", {
                                                    status: selectedOffer?.statut === "EN_ATTENTE"
                                                        ? t("employerOffers.status.pendingLower")
                                                        : t("employerOffers.status.rejectedLower")
                                                })
                                                : t("employerOffers.viewerReadOnlyMessage")}</p>
                                        ) : (
                                            <>
                                                <p className="flex items-start gap-2 text-xs leading-5 text-ink-soft">
                                                    <Icon
                                                        name="info"
                                                        className="mt-0.5 h-4 w-4 shrink-0"/>{t("employerOffers.resubmissionMessage")}
                                                </p>
                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                    <button type="button" onClick={clearForm}
                                                            disabled={!isAccountEmailValidated || isSubmitting || isOfferReadOnly}
                                                            className="inline-flex items-center justify-center rounded-xl border border-error bg-white px-5 py-3.5 text-sm font-bold text-error transition-colors hover:bg-[#fff0f3] focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50">
                                                        {t("employerOffers.clear")}
                                                    </button>
                                                    <button type="submit"
                                                            disabled={!isAccountEmailValidated || isSubmitting}
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50">
                                                        {isSubmitting ? t("employerOffers.submitting") : isNewOffer ? t("employerOffers.submit") : t("employerOffers.submitUpdated")}
                                                        {!isSubmitting && <Icon name="arrow" className="h-4 w-4"/>}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>}
                    {isApplicationsOpen && applicationsOffer?.statut === "VALIDE" && (
                        <ApplicationsModal
                            offer={applicationsOffer}
                            applications={applicationsByOffer[String(applicationsOffer.id)] ?? getApplicationsForOffer(applicationsOffer)}
                            language={i18n.resolvedLanguage}
                            isLoading={isLoadingApplications}
                            error={applicationsError}
                            onClose={() => {
                                setIsApplicationsOpen(false);
                                setApplicationsOffer(null);
                            }}
                            onScheduleInterview={(candidate) => {
                                setInterviewOfferId(applicationsOffer?.id ?? null);
                                setIsApplicationsOpen(false);
                                setApplicationsOffer(null);
                                setInterviewCandidate(candidate);
                            }}
                            onRefresh={() => loadApplications(applicationsOffer)}
                        />
                    )}

                    {interviewCandidate && (
                        <ScheduleInterviewModal
                            offerId={interviewOfferId}
                            candidat={interviewCandidate}
                            onClose={() => setInterviewCandidate(null)}
                            onSuccess={() => {
                                if (interviewOfferId) fetchApplications(interviewOfferId).catch(() => {
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
