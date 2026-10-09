import { useEffect, useState } from "react";
import {useTranslation} from "react-i18next";
import { api } from "../../utils/api.js";
import ValidationTabs from "./ValidationTabs.jsx";
import PdfPreview from "../PdfPreview.jsx";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const EXAMPLE_CVS = [
    {
        id: "example-cv-1",
        statut: "EN_ATTENTE",
        fileName: "camille-martin-cv.pdf",
        size: 1.2 * 1024 * 1024,
        prenom: "Camille",
        nom: "Martin",
        email: "camille.martin@example.com",
        discipline: "Informatique",
        submittedAt: "2026-09-28T10:30:00",
    },
    {
        id: "example-cv-2",
        statut: "EN_ATTENTE",
        fileName: "olivier-gagnon-cv.pdf",
        size: 980 * 1024,
        prenom: "Olivier",
        nom: "Gagnon",
        email: "olivier.gagnon@example.com",
        discipline: "Design graphique",
        submittedAt: "2026-09-27T15:45:00",
    },
];

function normalizeCv(cv) {
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

function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
}

function studentDisplayName(cv) {
    return [cv.firstName, cv.lastName].filter(hasValue).join(" ") || cv.studentName;
}

function formatDiscipline(value, t) {
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

function formatDate(value, language) {
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

function formatFileSizeInMb(size, locale) {
    const bytes = Number(size);
    if (!Number.isFinite(bytes) || bytes < 0) return "";

    return new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(bytes / (1024 * 1024));
}

function isPending(cv) {
    return cv.statut === "EN_ATTENTE";
}

function StatusBadge({ status }) {
    const {t} = useTranslation();
    const colors = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };

    const labels = {
        EN_ATTENTE: "studentCv.status.pending",
        VALIDE: "studentCv.status.approved",
        REJETE: "studentCv.status.rejected",
    };

    return (
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${colors[status] ?? colors.EN_ATTENTE}`}>
            {t(labels[status] ?? "studentCv.status.none")}
        </span>
    );
}

function InfoItem({ label, value }) {
    if (!hasValue(value)) return null;

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value}</p>
        </div>
    );
}

function GestionnaireCvValidation() {
    const {t, i18n} = useTranslation();
    const [cvs, setCvs] = useState(EXAMPLE_CVS.map(normalizeCv));
    const [selectedId, setSelectedId] = useState(EXAMPLE_CVS[0].id);
    const [comment, setComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [forbidden, setForbidden] = useState(false);

    const loadCvs = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError("");

        try {
            const response = await api.gestionnaire.getPendingDocuments("CV");

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("load_failed");

            const payload = await response.json();
            const documents = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? [];
            const normalized = documents.map(normalizeCv);

            setCvs(normalized);
            setSelectedId(normalized[0]?.id);
        } catch {
            setError("managerCvValidation.errors.unavailable");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadCvs();
        const intervalId = window.setInterval(() => loadCvs(false), AUTO_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, []);

    const pendingCvs = cvs.filter(isPending);
    const selectedCv = cvs.find((cv) => cv.id === selectedId) ?? pendingCvs[0];
    const selectedStudentName = selectedCv ? studentDisplayName(selectedCv) : "";
    const selectedDiscipline = selectedCv ? formatDiscipline(selectedCv.discipline, t) : "";
    const formattedFileSize = selectedCv
        ? formatFileSizeInMb(selectedCv.size, i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA")
        : "";

    const saveDecision = (id, result, status) => {
        const currentCv = cvs.find((cv) => cv.id === id);
        const updatedCv = normalizeCv(result ?? { ...currentCv, statut: status, commentaireRejet: comment });

        setCvs((current) => current.map((cv) => (
            cv.id === id ? { ...cv, ...updatedCv } : cv
        )));
    };

    const handleApprove = async () => {
        if (!selectedCv || !isPending(selectedCv) || saving) return;

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await api.gestionnaire.approveDocument(selectedCv.id);

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("managerCvValidation.errors.cvUnavailable");
                await loadCvs();
                return;
            }

            if (!response.ok) throw new Error("approve_failed");

            saveDecision(selectedCv.id, await response.json().catch(() => null), "VALIDE");
            setMessage("managerCvValidation.messages.approved");
        } catch {
            setError("managerCvValidation.errors.approve");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedCv || !isPending(selectedCv) || saving) return;

        if (!comment.trim()) {
            setError("managerCvValidation.errors.requiredComment");
            return;
        }

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await api.gestionnaire.rejectDocument(selectedCv.id, comment.trim());

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError("managerCvValidation.errors.cvUnavailable");
                await loadCvs();
                return;
            }

            if (!response.ok) throw new Error("reject_failed");

            saveDecision(selectedCv.id, await response.json().catch(() => null), "REJETE");
            setMessage("managerCvValidation.messages.rejected");
            setComment("");
            setShowRejectForm(false);
        } catch {
            setError("managerCvValidation.errors.reject");
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">{t("managerCvValidation.forbiddenTitle")}</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">
                        {t("managerCvValidation.forbiddenDescription")}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                            {t("managerCvValidation.title")}
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">
                            {t("managerCvValidation.description")}
                        </p>
                    </div>
                    <p className="text-xs font-semibold text-ink-soft">{t("managerValidation.autoRefresh")}</p>
                </div>

                <ValidationTabs activeTab="cvs" cvsCount={pendingCvs.length}/>

                {error && (
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error" role="alert">
                        {t(error)}
                    </p>
                )}
                {message && (
                    <p className="mt-6 rounded-xl border border-[#9ed9bd] bg-[#dff6e8] px-4 py-3 text-sm font-semibold text-[#245e3b]" role="status">
                        {t(message)}
                    </p>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.06)] lg:sticky lg:top-24">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-ink">{t("managerCvValidation.pending")}</h2>
                        </div>

                        <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1 overscroll-contain sm:max-h-[36rem]">
                            {loading ? (
                                <p className="rounded-xl bg-lavender/40 p-4 text-sm text-ink-soft">{t("managerCvValidation.loading")}</p>
                            ) : pendingCvs.length ? (
                                pendingCvs.map((cv) => (
                                    <button
                                        key={cv.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(cv.id);
                                            setMessage("");
                                            setError("");
                                        }}
                                        className={`w-full rounded-xl border p-3 text-left ${
                                            selectedCv?.id === cv.id
                                                ? "border-ink bg-ink text-white"
                                                : "border-line bg-canvas text-ink hover:bg-lavender/30"
                                        }`}
                                    >
                                        {hasValue(studentDisplayName(cv)) &&
                                            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{studentDisplayName(cv)}</p>}
                                        {hasValue(formatDiscipline(cv.discipline, t)) &&
                                            <p className="mt-1 text-xs opacity-70">{formatDiscipline(cv.discipline, t)}</p>}
                                        {hasValue(cv.fileName) &&
                                            <p className="mt-1 text-sm font-bold">{cv.fileName}</p>}
                                    </button>
                                ))
                            ) : (
                                <p className="rounded-xl bg-lavender/30 p-4 text-sm text-ink-soft">
                                    {t("managerCvValidation.noPending")}
                                </p>
                            )}
                        </div>
                    </aside>

                    {selectedCv ? (
                        <article className="rounded-2xl border border-line bg-surface shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            <div className="border-b border-line p-4 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StatusBadge status={selectedCv.statut} />
                                    <span
                                        className="text-xs text-ink-soft">{t("managerCvValidation.cvId", {id: selectedCv.id})}</span>
                                </div>
                                {hasValue(selectedStudentName) &&
                                    <h2 className="mt-4 break-words text-xl font-black text-ink sm:text-2xl">{selectedStudentName}</h2>}
                                {hasValue(selectedDiscipline) &&
                                    <p className="mt-1 text-sm font-semibold text-ink-soft">{selectedDiscipline}</p>}
                                {hasValue(selectedCv.email) &&
                                    <p className="mt-1 text-sm text-ink-soft">{selectedCv.email}</p>}
                            </div>

                            <div className="grid gap-5 p-4 sm:gap-6 sm:p-6 md:grid-cols-2">
                                <PdfPreview
                                    documentId={selectedCv.id}
                                    fileName={selectedCv.fileName}
                                    className="md:col-span-2"
                                />

                                <div className="md:col-span-2">
                                    <h3 className="font-black text-ink">{t("studentCv.previousRequest")}</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentCv.request")}</p>
                                            <p className="mt-1 text-sm font-semibold text-ink">{t("studentCv.requestSubmitted")}</p>
                                        </div>
                                        {hasValue(selectedCv.fileName) &&
                                            <InfoItem label={t("studentCv.fileName")} value={selectedCv.fileName}/>}
                                        {hasValue(formattedFileSize) && <InfoItem label={t("studentCv.fileSize")}
                                                                                  value={`${formattedFileSize} ${t("studentCv.fileSizeUnit")}`}/>}
                                        {hasValue(selectedCv.submittedAt) &&
                                            <InfoItem label={t("studentCv.submittedAt")}
                                                      value={formatDate(selectedCv.submittedAt, i18n.resolvedLanguage)}/>}
                                        {selectedCv.statut === "REJETE" && hasValue(selectedCv.commentaireRejet) && (
                                            <div
                                                className="rounded-xl border border-blush bg-blush/40 px-4 py-3 sm:col-span-3">
                                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentCv.rejectionReason")}</p>
                                                <p className="mt-1 text-sm leading-6 text-ink">{selectedCv.commentaireRejet}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(hasValue(selectedCv.firstName) || hasValue(selectedCv.lastName) || hasValue(selectedCv.email) || hasValue(selectedDiscipline)) && (
                                    <div className="md:col-span-2">
                                        <h3 className="font-black text-ink">{t("managerCvValidation.studentInformation")}</h3>
                                        <div
                                            className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                            <InfoItem label={t("auth.register.firstName")}
                                                      value={selectedCv.firstName}/>
                                            <InfoItem label={t("auth.register.lastName")} value={selectedCv.lastName}/>
                                            <InfoItem label={t("auth.login.email")} value={selectedCv.email}/>
                                            <InfoItem label={t("employerOffers.fields.discipline")}
                                                      value={selectedDiscipline}/>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isPending(selectedCv) ? (
                                <div className="border-t border-line bg-canvas/60 p-4 sm:p-6">
                                    {showRejectForm && (
                                        <div className="mb-4">
                                            <label htmlFor="cv-rejection-comment" className="text-sm font-bold text-ink">
                                                {t("managerCvValidation.requiredComment")}
                                            </label>
                                            <textarea
                                                id="cv-rejection-comment"
                                                value={comment}
                                                onChange={(event) => setComment(event.target.value)}
                                                rows="4"
                                                className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink-soft focus:ring-4 focus:ring-lavender/50"
                                                placeholder={t("managerCvValidation.rejectionPlaceholder")}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                        {showRejectForm && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setComment("");
                                                }}
                                                className="w-full rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/30 sm:w-auto"
                                            >
                                                {t("managerCvValidation.cancel")}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => (showRejectForm ? handleReject() : setShowRejectForm(true))}
                                            className="w-full rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3] sm:w-auto"
                                        >
                                            {showRejectForm ? t("managerCvValidation.confirmRejection") : t("managerCvValidation.reject")}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={handleApprove}
                                            className="w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft sm:w-auto"
                                        >
                                            {saving ? t("managerCvValidation.processing") : t("managerCvValidation.approve")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-line bg-canvas/60 p-5 text-sm font-semibold text-ink-soft sm:p-6">
                                    {t("managerCvValidation.alreadyProcessed")}
                                </div>
                            )}
                        </article>
                    ) : (
                        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
                            {t("managerCvValidation.selectCv")}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GestionnaireCvValidation;
