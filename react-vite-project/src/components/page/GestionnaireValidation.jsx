import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateMessage } from "../../utils/i18nMessage.js";
import api from "../../utils/api.js";
import ValidationTabs from "./ValidationTabs.jsx";
import PdfPreview from "../PdfPreview.jsx";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const SAMPLE_OFFERS = [
    {
        id: "sample-1",
        statut: "EN_ATTENTE",
        email: "marie.gagnon@novalab.ca",
        contactName: "Marie Gagnon",
        contactPhone: "+1 514 555-0182",
        nomEntreprise: "NovaLab",
        position: "Stagiaire en développement web",
        targetDiscipline: "INFORMATIQUE",
        adresseEntreprise: "Montréal, Québec",
        salaire: 22.5,
        descriptionPosition: "Contribuer au développement et à l’amélioration de fonctionnalités web pour les projets de l’équipe.",
        dateDebutStage: "2026-05-04",
        dateFinStage: "2026-08-21",
    },
    {
        id: "sample-2",
        statut: "EN_ATTENTE",
        email: "alexandre.roy@ateliernord.com",
        contactName: "Alexandre Roy",
        contactPhone: "+1 418 555-0114",
        nomEntreprise: "Atelier Nord",
        position: "Stagiaire en design graphique",
        targetDiscipline: "DESIGN_GRAPHIQUE",
        adresseEntreprise: "Québec, Québec",
        salaire: 20,
        descriptionPosition: "Créer des visuels pour les campagnes et les outils de communication de l’équipe.",
        dateDebutStage: "2026-01-12",
        dateFinStage: "2026-04-24",
    },
];

function createSampleOffers() {
    return SAMPLE_OFFERS.map((offer) => ({...offer}));
}

function normalizeOffer(offer, t) {
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

function formatDate(value, language) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatDateRange(start, end, language, t) {
    const formattedStart = formatDate(start, language);
    const formattedEnd = formatDate(end, language);

    if (!formattedStart && !formattedEnd) return "";
    if (!formattedStart) return formattedEnd;
    if (!formattedEnd) return formattedStart;

    return t("managerValidation.dateRange", {start: formattedStart, end: formattedEnd});
}

function formatDiscipline(value, t) {
    if (!value) return "";
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

function formatHourlyPay(value, language, t) {
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

function isPending(offer) {
    return offer.statut === "EN_ATTENTE";
}

function StatusBadge({status}) {
    const {t} = useTranslation();
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
    };
    const labelKeys = {
        EN_ATTENTE: "pending",
        VALIDE: "approved",
        REJETE: "rejected",
    };
    const statusKey = status === "VALIDÉ" ? "VALIDE" : status;

    return (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[statusKey] ?? styles.EN_ATTENTE}`}>
            {labelKeys[statusKey] ? t(`managerValidation.status.${labelKeys[statusKey]}`) : status}
        </span>
    );
}

function InfoItem({label, value}) {
    const {t} = useTranslation();

    if (value === null || value === undefined || String(value).trim() === "") return null;

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value}</p>
        </div>
    );
}

function GestionnaireValidation() {
    const {t, i18n} = useTranslation();
    const [offers, setOffers] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [comment, setComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [forbidden, setForbidden] = useState(false);

    const resetFormState = () => {
        setComment("");
        setShowRejectForm(false);
        setMessage(null);
        setError(null);
    };

    const loadOffers = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const response = await api.gestionnaire.getPendingDocuments("OffreDeStage");

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("load_failed");

            const data = await response.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            const normalized = list.map((offer) => normalizeOffer(offer, t));

            setOffers(normalized);

            if (normalized.length > 0) {
                setSelectedId((prevId) => {
                    const exists = normalized.some((item) => item.id === prevId);
                    return exists ? prevId : normalized[0].id;
                });
            } else {
                setSelectedId(null);
            }
        } catch {
            const samples = createSampleOffers().map((offer) => normalizeOffer(offer, t));
            setOffers(samples);
            setSelectedId(samples[0]?.id ?? null);
            setError({ key: "managerValidation.errors.unavailable" });
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
        const intervalId = window.setInterval(() => loadOffers(false), AUTO_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, []);

    const pendingOffers = useMemo(() => offers.filter(isPending), [offers]);
    const selectedOffer = offers.find((offer) => offer.id === selectedId) ?? pendingOffers[0];
    const hasSelectedEmployerInformation = selectedOffer && [
        selectedOffer.nomEntreprise,
        selectedOffer.contactName,
        selectedOffer.email,
        selectedOffer.contactPhone,
    ].some((value) => value !== null && value !== undefined && String(value).trim() !== "");
    const hasSelectedInternshipDetails = selectedOffer && [
        selectedOffer.position,
        selectedOffer.targetDiscipline,
        selectedOffer.dateDebutStage,
        selectedOffer.dateFinStage,
        selectedOffer.adresseEntreprise,
        selectedOffer.salaire,
        selectedOffer.descriptionPosition,
    ].some((value) => value !== null && value !== undefined && String(value).trim() !== "");

    const updateOffer = (id, result, fallbackStatus) => {
        const fallbackOffer = offers.find((offer) => offer.id === id);
        const updatedOffer = normalizeOffer(result ?? {
            ...fallbackOffer,
            statut: fallbackStatus,
            commentaireRejet: comment,
        }, t);

        setOffers((currentOffers) => currentOffers.map((offer) => (
            offer.id === id ? {...offer, ...updatedOffer} : offer
        )));
    };

    const handleApprove = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving) return;

        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await api.gestionnaire.approveDocument(selectedOffer.id);

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError({key: "managerValidation.errors.offerUnavailable"});
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("approve_failed");

            const responseData = await response.json().catch(() => null);
            updateOffer(selectedOffer.id, responseData, "VALIDE");
            setMessage({ key: "managerValidation.messages.approved" });
            resetFormState();
        } catch {
            updateOffer(selectedOffer.id, null, "VALIDE");
            setMessage({ key: "managerValidation.messages.approved" });
            resetFormState();
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving) return;

        if (!comment.trim()) {
            setError({key: "managerValidation.errors.requiredComment"});
            return;
        }

        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await api.gestionnaire.rejectDocument(selectedOffer.id, comment.trim());

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if ([400, 404, 409].includes(response.status)) {
                setError({key: "managerValidation.errors.offerUnavailable"});
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("reject_failed");

            const responseData = await response.json().catch(() => null);
            updateOffer(selectedOffer.id, responseData, "REJETE");
            setMessage({ key: "managerValidation.messages.rejected" });
            resetFormState();
        } catch {
            updateOffer(selectedOffer.id, null, "REJETE");
            setMessage({ key: "managerValidation.messages.rejected" });
            resetFormState();
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div
                    className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">{t("managerValidation.forbiddenTitle")}</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{t("managerValidation.forbiddenDescription")}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-ink">{t("managerValidation.title")}</h1>
                        <p className="mt-2 text-sm leading-6 text-ink-soft">{t("managerValidation.description")}</p>
                    </div>
                    <p className="text-xs font-semibold text-ink-soft">{t("managerValidation.autoRefresh")}</p>
                </div>

                <ValidationTabs activeTab="offers" offersCount={pendingOffers.length}/>

                {error &&
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error"
                       role="alert">{translateMessage(t, error)}</p>}
                {message &&
                    <p className="mt-6 rounded-xl border border-[#9ed9bd] bg-[#dff6e8] px-4 py-3 text-sm font-semibold text-[#245e3b]"
                       role="status">{translateMessage(t, message)}</p>}

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-ink">{t("managerValidation.pending")}</h2>
                        </div>

                        <div className="mt-4 space-y-2">
                            {loading ? (
                                <p className="rounded-xl bg-lavender/40 p-4 text-sm text-ink-soft">{t("managerValidation.loading")}</p>
                            ) : pendingOffers.length ? (
                                pendingOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(offer.id);
                                            resetFormState();
                                        }}
                                        className={`w-full rounded-xl border p-3 text-left ${selectedOffer?.id === offer.id ? "border-ink bg-ink text-white" : "border-line bg-canvas text-ink hover:bg-lavender/30"}`}
                                    >
                                        {offer.nomEntreprise &&
                                            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{offer.nomEntreprise}</p>}
                                        {offer.position && <p className="mt-1 text-sm font-bold">{offer.position}</p>}
                                    </button>
                                ))
                            ) : (
                                <p className="rounded-xl bg-lavender/30 p-4 text-sm text-ink-soft">{t("managerValidation.noPendingOffers")}</p>
                            )}
                        </div>
                    </aside>

                    {selectedOffer ? (
                        <article
                            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            <div className="border-b border-line p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StatusBadge status={selectedOffer.statut}/>
                                    <span
                                        className="text-xs text-ink-soft">{t("managerValidation.offerId", {id: selectedOffer.id})}</span>
                                </div>
                                {selectedOffer.position &&
                                    <h2 className="mt-4 text-2xl font-black text-ink">{selectedOffer.position}</h2>}
                                {selectedOffer.nomEntreprise &&
                                    <p className="mt-1 font-semibold text-ink-soft">{selectedOffer.nomEntreprise}</p>}
                            </div>

                            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
                                <PdfPreview
                                    documentId={selectedOffer.id}
                                    fileName={selectedOffer.fileName}
                                    className="md:col-span-2"
                                />

                                {hasSelectedEmployerInformation && <div className="md:col-span-2">
                                    <h3 className="font-black text-ink">{t("managerValidation.employerInformation")}</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                        <InfoItem label={t("managerValidation.companyName")}
                                                  value={selectedOffer.nomEntreprise}/>
                                        <InfoItem label={t("managerValidation.contactPerson")}
                                                  value={selectedOffer.contactName}/>
                                        <InfoItem label={t("managerValidation.email")} value={selectedOffer.email}/>
                                        <InfoItem label={t("managerValidation.phone")}
                                                  value={selectedOffer.contactPhone}/>
                                    </div>
                                </div>}

                                {hasSelectedInternshipDetails && <div className="md:col-span-2">
                                    <h3 className="font-black text-ink">{t("managerValidation.internshipDetails")}</h3>
                                    <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                        <InfoItem label={t("managerValidation.positionTitle")}
                                                  value={selectedOffer.position}/>
                                        <InfoItem label={t("managerValidation.discipline")}
                                                  value={formatDiscipline(selectedOffer.targetDiscipline, t)}/>
                                        <InfoItem label={t("managerValidation.dates")}
                                                  value={formatDateRange(selectedOffer.dateDebutStage, selectedOffer.dateFinStage, i18n.resolvedLanguage, t)}/>
                                        <InfoItem label={t("managerValidation.location")}
                                                  value={selectedOffer.adresseEntreprise}/>
                                        <InfoItem label={t("managerValidation.hourlyPay")}
                                                  value={formatHourlyPay(selectedOffer.salaire, i18n.resolvedLanguage, t)}/>
                                        {selectedOffer.descriptionPosition && <div className="sm:col-span-2"><InfoItem
                                            label={t("managerValidation.descriptionLabel")}
                                                                                 value={selectedOffer.descriptionPosition}/>
                                        </div>}
                                    </div>
                                </div>}
                            </div>

                            {isPending(selectedOffer) ? (
                                <div className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 sm:p-6">
                                    {showRejectForm && (
                                        <div className="mb-4">
                                            <label htmlFor="rejection-comment"
                                                   className="text-sm font-bold text-ink">{t("managerValidation.rejectionComment")}</label>
                                            <textarea id="rejection-comment" value={comment}
                                                      onChange={(event) => setComment(event.target.value)} rows="4"
                                                      className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink-soft focus:ring-4 focus:ring-lavender/50"
                                                      placeholder={t("managerValidation.rejectionPlaceholder")}/>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap justify-end gap-3">
                                        {showRejectForm && <button type="button" onClick={() => {
                                            setShowRejectForm(false);
                                            setComment("");
                                        }}
                                                                   className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/30">{t("managerValidation.cancel")}</button>}
                                        <button type="button" disabled={saving}
                                                onClick={() => showRejectForm ? handleReject() : setShowRejectForm(true)}
                                                className="rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3]">{showRejectForm ? t("managerValidation.confirmRejection") : t("managerValidation.reject")}</button>
                                        <button type="button" disabled={saving} onClick={handleApprove}
                                                className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft">{saving ? t("managerValidation.processing") : t("managerValidation.approve")}</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 text-sm font-semibold text-ink-soft">{t("managerValidation.alreadyProcessed")}</div>
                            )}
                        </article>
                    ) : (
                        <div
                            className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">{t("managerValidation.selectOffer")}</div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GestionnaireValidation;
