import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateMessage } from "../../../utils/i18nMessage.js";
import DropdownSelect from "../../DropdownSelect.jsx";
import api from "../../../utils/api.js";
import GestionnaireTabs from "./GestionnaireTabs.jsx";
import PdfPreview from "../../PdfPreview.jsx";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

function normalizeOffer(offer, t) {
    return {
        ...offer,
        id: offer.id ?? offer.documentId,
        sessionId: offer.sessionId ?? offer.sessionCode ?? offer.session ?? "",
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
    }).format(date);
}

function formatDateRange(start, end, language, t) {
    const formattedStart = formatDate(start, language);
    const formattedEnd = formatDate(end, language);

    if (!formattedStart && !formattedEnd) return "";
    if (!formattedStart) return formattedEnd;
    if (!formattedEnd) return formattedStart;

    return t("managerValidation.dateRange", { start: formattedStart, end: formattedEnd, defaultValue: `Du ${formattedStart} au ${formattedEnd}` });
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
    return t(`employerOffers.disciplines.${disciplineKey}`, { defaultValue: value });
}

function formatHourlyPay(value, language, t) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return t("managerValidation.unpaid", { defaultValue: "Non rémunéré" });
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

function StatusBadge({ status }) {
    const { t } = useTranslation();
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
            {labelKeys[statusKey] ? t(`managerValidation.status.${labelKeys[statusKey]}`, { defaultValue: statusKey }) : status}
        </span>
    );
}

function InfoItem({ label, value }) {
    if (value === null || value === undefined || String(value).trim() === "") return null;

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-1 text-sm text-ink">{value}</p>
        </div>
    );
}

function GestionnaireValidation({ embedded = false, hideEmbeddedHeading = false }) {
    const { t, i18n } = useTranslation();

    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");

    const [offers, setOffers] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("EN_ATTENTE");

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

    // 1. Récupération des sessions académiques
    useEffect(() => {
        let isMounted = true;

        async function fetchSessionsFromBackend() {
            try {
                const response = await api.gestionnaire.getSessions();

                if (response.status === 403) {
                    if (isMounted) setForbidden(true);
                    return;
                }

                if (!response.ok) throw new Error("sessions_load_failed");

                const data = await response.json();
                const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];

                if (isMounted && list.length > 0) {
                    setSessions(list);
                    setSelectedSessionId("ALL");
                }
            } catch {
                if (isMounted) {
                    setError({ key: "managerOffersSession.errors.loadFailed", defaultValue: "Erreur lors du chargement des sessions académiques." });
                }
            }
        }

        fetchSessionsFromBackend();
        return () => { isMounted = false; };
    }, []);

    // 2. Chargement STRICTEMENT PAR SESSION (Toutes les offres de la session choisie)
    const loadOffers = async (showLoading = true) => {
        if (!selectedSessionId) return;
        if (showLoading) setLoading(true);
        setError(null);

        try {
            const response = selectedSessionId === "ALL"
                ? await api.gestionnaire.getAllOffers()
                : await api.gestionnaire.getOffersBySession(selectedSessionId);

            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("offers_load_failed");

            const data = await response.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            const normalized = list.map((offer) => normalizeOffer(offer, t));

            // Tri pour placer les offres EN_ATTENTE en haut de la liste de la session
            const sortedOffers = [...normalized].sort((a, b) =>
                Number(isPending(b)) - Number(isPending(a)) || Number(b.id) - Number(a.id)
            );

            setOffers(sortedOffers);
        } catch {
            setOffers([]);
            setError({ key: "managerValidation.errors.unavailable", defaultValue: "Impossible de charger les offres pour cette session." });
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
        const intervalId = window.setInterval(() => loadOffers(false), AUTO_REFRESH_INTERVAL_MS);
        return () => window.clearInterval(intervalId);
    }, [selectedSessionId]);

    // 3. Filtrage combiné (Recherche + Statut)
    const filteredOffers = useMemo(() => {
        return offers.filter((offer) => {
            const position = (offer.position || "").toLowerCase();
            const company = (offer.nomEntreprise || "").toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = position.includes(searchLower) || company.includes(searchLower);

            const matchesStatus = statusFilter === "ALL" || offer.statut === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [offers, searchTerm, statusFilter]);

    const pendingOffers = useMemo(() => filteredOffers.filter(isPending), [filteredOffers]);

    useEffect(() => {
        if (filteredOffers.length > 0) {
            setSelectedId((prevId) => {
                const exists = filteredOffers.some((item) => item.id === prevId);
                return exists ? prevId : filteredOffers[0].id;
            });
        } else {
            setSelectedId(null);
        }
    }, [filteredOffers]);

    const selectedOffer = filteredOffers.find((offer) => offer.id === selectedId) ?? filteredOffers[0];

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
            offer.id === id ? { ...offer, ...updatedOffer } : offer
        )));
    };

    const handleApprove = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving || showRejectForm) return;

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
                setError({ key: "managerValidation.errors.offerUnavailable" });
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("approve_failed");

            const responseData = await response.json().catch(() => null);
            updateOffer(selectedOffer.id, responseData, "VALIDE");
            resetFormState();
            setMessage({ key: "managerValidation.messages.approved" });
        } catch {
            updateOffer(selectedOffer.id, null, "VALIDE");
            resetFormState();
            setMessage({ key: "managerValidation.messages.approved" });
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOffer || !isPending(selectedOffer) || saving) return;

        if (!comment.trim()) {
            setError({ key: "managerValidation.errors.requiredComment" });
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
                setError({ key: "managerValidation.errors.offerUnavailable" });
                await loadOffers();
                return;
            }

            if (!response.ok) throw new Error("reject_failed");

            const responseData = await response.json().catch(() => null);
            updateOffer(selectedOffer.id, responseData, "REJETE");
            resetFormState();
            setMessage({ key: "managerValidation.messages.rejected" });
        } catch {
            updateOffer(selectedOffer.id, null, "REJETE");
            resetFormState();
            setMessage({ key: "managerValidation.messages.rejected" });
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">{t("managerValidation.forbiddenTitle", { defaultValue: "Accès refusé" })}</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{t("managerValidation.forbiddenDescription", { defaultValue: "Seul le personnel autorisé (Gestionnaire de Stage / Professeur) a accès à cette vue." })}</p>
                </div>
            </section>
        );
    }

    const currentSessionName = selectedSessionId === "ALL"
        ? t("managerValidation.allSessions")
        : sessions.find((s) => (s.id || s.code) === selectedSessionId)?.name || selectedSessionId;

    return (
        <section className={embedded ? "mt-10" : "flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"}>
            <div className="mx-auto w-full max-w-6xl">
                {!embedded && (
                    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <span className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                                {t("managerDashboard.eyebrow", { defaultValue: "Espace gestionnaire" })}
                            </span>
                            <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                                {t("managerValidation.title", { defaultValue: "Gestion des offres" })}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                                {t("managerOffersSession.description", { defaultValue: "Consultez et validez les offres de stage structurées par session collégiale du Cégep." })}
                            </p>
                        </div>
                        <p className="shrink-0 text-xs font-semibold text-ink-soft">{t("managerValidation.autoRefresh", { defaultValue: "Actualisation automatique 1 min" })}</p>
                    </header>
                )}

                {embedded && !hideEmbeddedHeading && (
                    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-ink">{t("managerValidation.title", { defaultValue: "Gestion des offres" })}</h2>
                            <p className="mt-2 text-sm leading-6 text-ink-soft">{t("managerValidation.description", { defaultValue: "Consultez et validez les offres de stage." })}</p>
                        </div>
                        <p className="text-xs font-semibold text-ink-soft">{t("managerValidation.autoRefresh", { defaultValue: "Actualisation automatique 1 min" })}</p>
                    </div>
                )}

                {!embedded && <GestionnaireTabs activeTab="offers" offersCount={pendingOffers.length} />}

                <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:grid-cols-3 sm:items-end">
                    <div>
                        <label htmlFor="cegep-session-select" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                            {t("managerOffersSession.sessionSelect", { defaultValue: "Session du Cégep" })}
                        </label>
                        <DropdownSelect
                            id="cegep-session-select"
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-ink"
                        >
                            <option value="ALL">
                                {t("managerValidation.allSessions")}
                            </option>
                            {sessions.map((session) => (
                                <option key={session.id || session.code} value={session.id || session.code}>
                                    {session.name || session.libelle || session.code} {session.isCurrent || session.active || session.courante ? " (Courante)" : ""}
                                </option>
                            ))}
                        </DropdownSelect>
                    </div>

                    <div>
                        <label htmlFor="search-offers-input" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                            {t("common.search", { defaultValue: "Recherche (Poste, Entreprise)" })}
                        </label>
                        <input
                            id="search-offers-input"
                            type="text"
                            placeholder={t("managerOffersSession.searchPlaceholder", { defaultValue: "Rechercher par poste ou entreprise..." })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                        />
                    </div>

                    <div>
                        <label htmlFor="status-filter-select" className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1">
                            {t("managerOffersSession.filters.status", { defaultValue: "Statut de l'offre" })}
                        </label>
                        <DropdownSelect
                            id="status-filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-ink"
                        >
                            <option value="ALL">{t("managerOffersSession.filters.allStatuses", { defaultValue: "Toutes les offres" })}</option>
                            <option value="EN_ATTENTE">{t("managerOffersSession.filters.pending", { defaultValue: "En attente" })}</option>
                            <option value="VALIDE">{t("managerOffersSession.filters.validated", { defaultValue: "Validées" })}</option>
                            <option value="REJETE">{t("managerOffersSession.filters.rejected", { defaultValue: "Refusées" })}</option>
                        </DropdownSelect>
                    </div>
                </div>

                {error && (
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error" role="alert">
                        {translateMessage(t, error)}
                    </p>
                )}
                {message && (
                    <p className="mt-6 rounded-xl border border-[#9ed9bd] bg-[#dff6e8] px-4 py-3 text-sm font-semibold text-[#245e3b]" role="status">
                        {translateMessage(t, message)}
                    </p>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-ink">{t("managerValidation.pending", { defaultValue: "Offres affichées" })} ({filteredOffers.length})</h2>
                        </div>

                        <div className="mt-4 space-y-2">
                            {loading ? (
                                <p className="rounded-xl bg-lavender/40 p-4 text-sm text-ink-soft">{t("managerValidation.loading", { defaultValue: "Chargement..." })}</p>
                            ) : filteredOffers.length ? (
                                filteredOffers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(offer.id);
                                            resetFormState();
                                        }}
                                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                                            selectedOffer?.id === offer.id
                                                ? "border-ink bg-ink text-white"
                                                : "border-line bg-canvas text-ink hover:bg-lavender/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            {offer.nomEntreprise && (
                                                <p className="text-xs font-bold uppercase tracking-wide opacity-70 truncate">{offer.nomEntreprise}</p>
                                            )}
                                            <span className={`h-2 w-2 rounded-full ${
                                                offer.statut === "VALIDE" ? "bg-emerald-500" : offer.statut === "REJETE" ? "bg-rose-500" : "bg-amber-500"
                                            }`} />
                                        </div>
                                        {offer.position && <p className="mt-1 text-sm font-bold truncate">{offer.position}</p>}
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-xl bg-lavender/30 p-4 text-center">
                                    <p className="text-sm font-bold text-ink">
                                        {t("managerOffersSession.emptyTitle", { defaultValue: "Aucune offre trouvée" })}
                                    </p>
                                    <p className="mt-1 text-xs text-ink-soft">
                                        {t("managerOffersSession.emptyDescription", {
                                            defaultValue: `Aucune offre enregistrée pour la session ${currentSessionName}.`,
                                            sessionName: currentSessionName
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>

                    {selectedOffer ? (
                        <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            <div className="border-b border-line p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <StatusBadge status={selectedOffer.statut} />
                                    <span className="text-xs text-ink-soft">
                                        {t("managerValidation.offerId", { id: selectedOffer.id, defaultValue: `ID : ${selectedOffer.id}` })}
                                    </span>
                                </div>
                                {selectedOffer.position && <h2 className="mt-4 text-2xl font-black text-ink">{selectedOffer.position}</h2>}
                                {selectedOffer.nomEntreprise && <p className="mt-1 font-semibold text-ink-soft">{selectedOffer.nomEntreprise}</p>}
                            </div>

                            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
                                <PdfPreview documentId={selectedOffer.id} fileName={selectedOffer.fileName} className="md:col-span-2" />

                                {hasSelectedEmployerInformation && (
                                    <div className="md:col-span-2">
                                        <h3 className="font-black text-ink">{t("managerValidation.employerInformation", { defaultValue: "Informations de l'employeur" })}</h3>
                                        <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                            <InfoItem label={t("managerValidation.companyName", { defaultValue: "Entreprise" })} value={selectedOffer.nomEntreprise} />
                                            <InfoItem label={t("managerValidation.contactPerson", { defaultValue: "Contact" })} value={selectedOffer.contactName} />
                                            <InfoItem label={t("managerValidation.email", { defaultValue: "Courriel" })} value={selectedOffer.email} />
                                            <InfoItem label={t("managerValidation.phone", { defaultValue: "Téléphone" })} value={selectedOffer.contactPhone} />
                                        </div>
                                    </div>
                                )}

                                {hasSelectedInternshipDetails && (
                                    <div className="md:col-span-2">
                                        <h3 className="font-black text-ink">{t("managerValidation.internshipDetails", { defaultValue: "Détails du stage" })}</h3>
                                        <div className="mt-3 grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                                            <InfoItem label={t("managerValidation.positionTitle", { defaultValue: "Intitulé du poste" })} value={selectedOffer.position} />
                                            <InfoItem label={t("managerValidation.discipline", { defaultValue: "Discipline" })} value={formatDiscipline(selectedOffer.targetDiscipline, t)} />
                                            <InfoItem label={t("managerValidation.dates", { defaultValue: "Dates du stage" })} value={formatDateRange(selectedOffer.dateDebutStage, selectedOffer.dateFinStage, i18n.resolvedLanguage, t)} />
                                            <InfoItem label={t("managerValidation.location", { defaultValue: "Lieu" })} value={selectedOffer.adresseEntreprise} />
                                            <InfoItem label={t("managerValidation.hourlyPay", { defaultValue: "Rémunération" })} value={formatHourlyPay(selectedOffer.salaire, i18n.resolvedLanguage, t)} />
                                            {selectedOffer.descriptionPosition && (
                                                <div className="sm:col-span-2">
                                                    <InfoItem label={t("managerValidation.descriptionLabel", { defaultValue: "Description du poste" })} value={selectedOffer.descriptionPosition} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isPending(selectedOffer) ? (
                                <div className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 sm:p-6">
                                    {showRejectForm && (
                                        <div className="mb-4">
                                            <label htmlFor="rejection-comment" className="text-sm font-bold text-ink">
                                                {t("managerValidation.rejectionComment", { defaultValue: "Motif du refus" })}
                                            </label>
                                            <textarea
                                                id="rejection-comment"
                                                value={comment}
                                                onChange={(event) => {
                                                    setComment(event.target.value);
                                                    setError(null);
                                                }}
                                                rows="4"
                                                autoFocus
                                                className="mt-2 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-ink-soft focus:ring-4 focus:ring-lavender/50"
                                                placeholder={t("managerValidation.rejectionPlaceholder", { defaultValue: "Expliquez les motifs du refus..." })}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-wrap justify-end gap-3">
                                        {showRejectForm && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setComment("");
                                                }}
                                                className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lavender/30"
                                            >
                                                {t("managerValidation.cancel", { defaultValue: "Annuler" })}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={saving || (showRejectForm && !comment.trim())}
                                            onClick={() => {
                                                if (showRejectForm) {
                                                    handleReject();
                                                    return;
                                                }
                                                setError(null);
                                                setMessage(null);
                                                setShowRejectForm(true);
                                            }}
                                            className="rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {showRejectForm ? t("managerValidation.confirmRejection", { defaultValue: "Confirmer le refus" }) : t("managerValidation.reject", { defaultValue: "Refuser" })}
                                        </button>
                                        {!showRejectForm && (
                                            <button
                                                type="button"
                                                disabled={saving}
                                                onClick={handleApprove}
                                                className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft"
                                            >
                                                {saving ? t("managerValidation.processing", { defaultValue: "Traitement..." }) : t("managerValidation.approve", { defaultValue: "Approuver" })}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-b-2xl border-t border-line bg-canvas/60 p-5 text-sm font-semibold text-ink-soft">
                                    {t("managerValidation.alreadyProcessed", { defaultValue: "Cette offre a déjà été traitée." })}
                                </div>
                            )}
                        </article>
                    ) : (
                        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
                            {t("managerOffersSession.noSelectedOffer", { defaultValue: "Aucune offre sélectionnée pour cette session." })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default GestionnaireValidation;
