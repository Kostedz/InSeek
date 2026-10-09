import React, {useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {createTranslationMessage, translateMessage} from "../../utils/i18nMessage.js";
import api from "../../utils/api.js";
import Loading from "../Loading.jsx";
import ErrorPage from "../ErrorPage.jsx";

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

function normalizeStatus(status) {
    const normalized = String(status ?? "").toUpperCase();
    if (["VALIDATED", "VALIDÉ", "VALIDE", "APPROVED", "APPROUVE"].includes(normalized)) return "VALIDE";
    if (["REJECTED", "REJECTE", "REJETÉ", "REJETE"].includes(normalized)) return "REJETE";
    if (["PENDING", "EN_ATTENTE", "EN ATTENTE"].includes(normalized)) return "EN_ATTENTE";
    return "NOT_SUBMITTED";
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
    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
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

export function buildOfferSubmissionFormData({file, fields, offerId}) {
    const formData = new FormData();
    formData.append("file", file);
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

function errorForOfferStatus(status) {
    if (status === 401) return createTranslationMessage("errors.unauthorized");
    if (status === 403) return createTranslationMessage("errors.forbidden");
    return createTranslationMessage("employerOffers.errors.loadFailed");
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
                                        }) {
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const {t, i18n} = useTranslation();
    const employerCompanyName = String(
        user?.nomCompagnie
        || user?.companyName
        || companyName
        || (user?.isDevAccess ? "InSeek" : "")
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
    const [selectedId, setSelectedId] = useState(initialOffers[0]?.id ?? null);
    const [formValues, setFormValues] = useState(() => formValuesFromOffer(initialOffers[0], employerCompanyName));
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewOffer, setIsNewOffer] = useState(!initialOffers[0]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [localDrafts, setLocalDrafts] = useState({});
    const drafts = externalDrafts ?? localDrafts;
    const saveDrafts = setExternalDrafts ?? setLocalDrafts;

    const selectedOffer = offerList.find((offer) => offer.id === selectedId) ?? null;
    const isOfferReadOnly = !canManageOffers || ["REJETE", "EN_ATTENTE"].includes(selectedOffer?.statut);
    const pendingCount = offerList.filter((offer) => offer.statut === "EN_ATTENTE").length;
    const publishedCount = offerList.filter((offer) => offer.statut === "VALIDE").length;
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
        setSelectedId(initialOffers[0]?.id ?? null);
        setIsNewOffer(!initialOffers[0]);
        setFormValues(formValuesFromOffer(initialOffers[0], employerCompanyName));
    }, [initialOffers, employerCompanyName]);

    useEffect(() => {
        if (!isNewOffer) {
            const draft = drafts[String(selectedId)];
            setFormValues(draft?.fields ?? formValuesFromOffer(selectedOffer, employerCompanyName));
            setSelectedFile(draft?.file ?? null);
            setFieldErrors({});
            setFileError("");
            setFormError("");
            setSuccessMessage("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [selectedId, isNewOffer, employerCompanyName, drafts]);

    const selectOffer = (offer) => {
        const draft = drafts[String(offer.id)];
        setIsNewOffer(false);
        setSelectedId(offer.id);
        setIsEditorOpen(true);
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
        setIsNewOffer(true);
        setSelectedId(null);
        setIsEditorOpen(true);
        setFormValues(draft?.fields ?? {...EMPTY_FORM, nomEntreprise: employerCompanyName});
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
        const nextValues = {...formValues, [name]: value};
        const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
        setFormValues(nextValues);
        saveDrafts((current) => ({
            ...current,
            [draftKey]: {fields: nextValues, file: selectedFile},
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
        const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
        saveDrafts((current) => ({
            ...current,
            [draftKey]: {fields: formValues, file},
        }));
        return true;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!validateFile(file)) {
            setSelectedFile(null);
            const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
            saveDrafts((current) => ({
                ...current,
                [draftKey]: {fields: formValues, file: null},
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
            const draftKey = isNewOffer ? NEW_OFFER_DRAFT_KEY : String(selectedId);
            saveDrafts((current) => ({
                ...current,
                [draftKey]: {fields: formValues, file: null},
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
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
            if (!String(formValues[field] ?? "").trim()) errors[field] = message;
        });
        if (formValues.email && !/^\S+@\S+\.\S+$/.test(formValues.email)) {
            errors.email = "employerOffers.errors.invalidEmail";
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
            setFormError(selectedOffer?.statut === "EN_ATTENTE"
                ? "employerOffers.errors.pendingReadOnly"
                : "employerOffers.errors.rejectedReadOnly");
            return;
        }
        if (!selectedFile) {
            setFileError("employerOffers.errors.fileRequired");
        }
        if (!validateForm() || !selectedFile) return;

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
                setRemoteOffers((current) => mode === "update"
                    ? (current ?? []).map((item) => item.id === offer.id ? offer : item)
                    : [offer, ...(current ?? [])]);

                return {response, offer};
            });

            const result = await submitOffer({
                    offerId: selectedOffer?.id ?? null,
                    mode: isNewOffer ? "create" : "update",
                    fields: formValues,
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
            setSelectedFile(null);
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
            setIsSubmitting(false);
        }
    };

    const handleEditorBackdropMouseDown = (event) => {
        if (event.target === event.currentTarget && !isSubmitting) setIsEditorOpen(false);
    };

    const closeEditor = () => {
        if (!isSubmitting) setIsEditorOpen(false);
    };

    if (isLoadingOffers) return <Loading/>;
    if (loadError) return <ErrorPage error={loadError}/>;

    return (
        <section className="flex-1 bg-canvas px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <div>
                    <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-ink sm:text-3xl">{t("employerOffers.title")}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">{t("employerOffers.description")}</p>
                </div>

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

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t("employerOffers.stats.myOffers")}</p>
                        <p className="mt-2 text-2xl font-black text-ink">{offerList.length}</p>
                        <p className="mt-1 text-sm text-ink-soft">{offerList.length === 1 ? t("employerOffers.stats.savedSingular") : t("employerOffers.stats.savedPlural")}</p>
                    </div>
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t("employerOffers.stats.pending")}</p>
                        <p className="mt-2 text-2xl font-black text-ink">{pendingCount}</p>
                        <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.stats.pendingDescription")}</p>
                    </div>
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t("employerOffers.stats.published")}</p>
                        <p className="mt-2 text-2xl font-black text-ink">{publishedCount}</p>
                        <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.stats.publishedDescription")}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <aside
                        className="rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.workspace")}</p>
                                <h2 className="mt-2 text-xl font-black tracking-tight text-ink">{t("employerOffers.myOffersTitle")}</h2>
                            </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-ink-soft">{t("employerOffers.selectOfferDescription")}</p>

                        <div className="mt-6 space-y-3">
                            {offerList.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-line bg-canvas p-5 text-center">
                                    <p className="mt-0 text-sm font-bold text-ink">{t("employerOffers.emptyTitle")}</p>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">{t("employerOffers.emptyDescription")}</p>
                                </div>
                            )}
                            {offerList.map((offer) => (
                                <button
                                    key={offer.id}
                                    type="button"
                                    onClick={() => selectOffer(offer)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${selectedId === offer.id && !isNewOffer ? "border-ink bg-lavender/30" : "border-line bg-canvas hover:border-lavender hover:bg-lavender/15"}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink"><Icon
                                            name="file" className="h-4 w-4"/></span>
                                        <StatusBadge status={offer.statut}/>
                                    </div>
                                    <p className="mt-4 line-clamp-2 text-sm font-black leading-5 text-ink">{offer.position || t("employerOffers.untitledOffer")}</p>
                                    <p className="mt-1 truncate text-xs text-ink-soft">{offer.fileName || t("employerOffers.noFile")}</p>
                                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-soft">
                                        <span>{t("employerOffers.version", {version: offer.version ?? 1})}</span>
                                        <span>{formatDate(offer.updatedAt, i18n.resolvedLanguage)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {canManageOffers && <button type="button" onClick={startNewOffer}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40">
                            <Icon name="plus" className="h-4 w-4"/> {t("employerOffers.newOffer")}
                        </button>}
                    </aside>

                    {isEditorOpen && <div
                        className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/70 p-3 backdrop-blur-sm sm:p-6 lg:items-center"
                        onMouseDown={handleEditorBackdropMouseDown}
                    >
                    <div ref={formRef}
                         className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-y-auto rounded-[2rem] border border-line bg-surface p-5 shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:p-7"
                         role="dialog"
                         aria-modal="true"
                         aria-labelledby="employer-offer-editor-title">
                        <div
                            className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.editor.label")}</p>
                                    {!isNewOffer && selectedOffer && <StatusBadge status={selectedOffer.statut}/>}
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
                            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blush bg-blush/30 p-4"
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
                            role="status" aria-live="polite"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0"/><p
                            className="font-semibold">{translateMessage(t, successMessage)}</p></div>}
                        {formError && <div
                            className="mt-6 rounded-2xl border border-error bg-blush/25 p-4 text-sm font-semibold text-error"
                            role="alert">{translateMessage(t, formError)}</div>}

                        <form className="mt-7 space-y-8" onSubmit={handleSubmit} noValidate>
                            <fieldset disabled={!isAccountEmailValidated || isSubmitting || isOfferReadOnly}
                                      className="space-y-8">
                                <div>
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
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
                                            {!selectedFile && selectedOffer?.fileName && <div
                                                className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink-soft">
                                                <Icon name="file" className="h-4 w-4 shrink-0"/><span
                                                className="truncate">{t("employerOffers.currentFile")} <strong
                                                className="text-ink">{selectedOffer.fileName}</strong></span></div>}
                                        </div>
                                    )}
                                    {fileError && <p className="mt-2 text-sm font-semibold text-error"
                                                     role="alert">{translateMessage(t, fileError)}</p>}
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-ink">{t("employerOffers.detailsStepTitle")}</h3>
                                    <p className="mt-1 text-sm text-ink-soft">{t("employerOffers.detailsStepDescription")}</p>
                                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                        <Field id="position" label={t("employerOffers.fields.position")} required
                                               error={fieldErrors.position}>
                                            <input id="position" name="position" value={formValues.position}
                                                   onChange={updateField} className={inputClass(fieldErrors.position)}
                                                   placeholder={t("employerOffers.placeholders.position")}/>
                                        </Field>
                                        <Field id="targetDiscipline" label={t("employerOffers.fields.discipline")}
                                               required
                                               error={fieldErrors.targetDiscipline}>
                                            <select id="targetDiscipline" name="targetDiscipline"
                                                    value={formValues.targetDiscipline} onChange={updateField}
                                                    className={inputClass(fieldErrors.targetDiscipline)}>
                                                <option value="">{t("employerOffers.fields.selectDiscipline")}</option>
                                                {DISCIPLINES.map(([value]) => <option key={value}
                                                                                      value={value}>{t(`employerOffers.disciplines.${value}`)}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="adresseEntreprise" label={t("employerOffers.fields.companyAddress")}
                                               required
                                               error={fieldErrors.adresseEntreprise}>
                                            <input id="adresseEntreprise" name="adresseEntreprise"
                                                   value={formValues.adresseEntreprise} onChange={updateField}
                                                   className={inputClass(fieldErrors.adresseEntreprise)}
                                                   placeholder={t("employerOffers.placeholders.companyAddress")}/>
                                        </Field>
                                        <Field id="dateDebutStage" label={t("employerOffers.fields.startDate")} required
                                               error={fieldErrors.dateDebutStage}>
                                            <input id="dateDebutStage" type="date" name="dateDebutStage"
                                                   value={formValues.dateDebutStage} onChange={updateField}
                                                   className={inputClass(fieldErrors.dateDebutStage)}/>
                                        </Field>
                                        <Field id="dateFinStage" label={t("employerOffers.fields.endDate")} required
                                               error={fieldErrors.dateFinStage}>
                                            <input id="dateFinStage" type="date" name="dateFinStage"
                                                   value={formValues.dateFinStage} onChange={updateField}
                                                   className={inputClass(fieldErrors.dateFinStage)}/>
                                        </Field>
                                        <Field id="salaire" label={t("employerOffers.fields.hourlyPay")}
                                               error={fieldErrors.salaire}>
                                            <div className="relative"><input id="salaire" type="number" min="0"
                                                                             step="0.01" name="salaire"
                                                                             value={formValues.salaire}
                                                                             onChange={updateField}
                                                                             className={`${inputClass(fieldErrors.salaire)} pr-12`}
                                                                             placeholder={t("employerOffers.placeholders.hourlyPay")}/><span
                                                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-soft">$/h</span>
                                            </div>
                                        </Field>
                                    </div>
                                    <Field id="descriptionPosition" label={t("employerOffers.fields.description")}
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
                                    <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft"><Icon
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
                                        <p className="flex items-start gap-2 text-xs leading-5 text-ink-soft"><Icon
                                            name="info"
                                            className="mt-0.5 h-4 w-4 shrink-0"/>{t("employerOffers.resubmissionMessage")}
                                        </p>
                                        <button type="submit" disabled={!isAccountEmailValidated || isSubmitting}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50">
                                            {isSubmitting ? t("employerOffers.submitting") : isNewOffer ? t("employerOffers.submit") : t("employerOffers.submitUpdated")}
                                            {!isSubmitting && <Icon name="arrow" className="h-4 w-4"/>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                    </div>}
                </div>
            </div>
        </section>
    );
}
