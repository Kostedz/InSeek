import React, {useEffect, useMemo, useRef, useState} from "react";

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

const DEMO_OFFERS = [
    {
        id: "offre-demo-17",
        statut: "EN_ATTENTE",
        fileName: "offre-stage-developpement.pdf",
        nomEntreprise: "Atelier Nord",
        position: "Stagiaire en développement web",
        descriptionPosition: "Contribuer au développement de fonctionnalités web et aux tests automatisés avec l’équipe produit.",
        dateDebutStage: "2027-01-11",
        dateFinStage: "2027-04-30",
        adresseEntreprise: "1450, rue Saint-Urbain, Montréal, QC",
        salaire: 22.5,
        email: "marie.gagnon@ateliernord.ca",
        contactName: "Marie Gagnon",
        contactPhone: "+1 514 555-0182",
        targetDiscipline: "INFORMATIQUE",
        version: 1,
        updatedAt: "2026-09-28",
    },
];

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

function formValuesFromOffer(offer) {
    if (!offer) return {...EMPTY_FORM};

    return {
        nomEntreprise: offer.nomEntreprise ?? "",
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

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatFileSize(bytes) {
    if (!bytes) return "";
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function StatusBadge({status}) {
    const styles = {
        EN_ATTENTE: "border-gold bg-gold/45 text-ink",
        VALIDE: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJETE: "border-[#eab0bf] bg-[#fff0f3] text-error",
        NOT_SUBMITTED: "border-line bg-canvas text-ink-soft",
    };
    const labels = {
        EN_ATTENTE: "En attente de validation",
        VALIDE: "Publiée",
        REJETE: "Refusée",
        NOT_SUBMITTED: "Brouillon",
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
        upload: <>
            <path d="M12 16V4M7 9l5-5 5 5"/>
            <path d="M5 20h14"/>
        </>,
        plus: <>
            <path d="M12 5v14M5 12h14"/>
        </>,
        arrow: <>
            <path d="M5 12h14M13 6l6 6-6 6"/>
        </>,
        shield: <path d="M12 3 4.5 6v5.2c0 4.8 3.2 8.1 7.5 9.8 4.3-1.7 7.5-5 7.5-9.8V6z"/>,
        info: <>
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 11v5M12 8h.01"/>
        </>,
        edit: <>
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>
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
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
                {label} {required && <span className="text-error" aria-hidden="true">*</span>}
            </label>
            {children}
            {error && <p className="mt-1.5 text-xs font-semibold text-error" role="alert">{error}</p>}
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

export default function EmployeurOffres({
                                            offers,
                                            isAccountEmailValidated = true,
                                            onSubmit,
                                            companyName = "",
                                        }) {
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const initialOffers = useMemo(() => (
        (offers === undefined ? DEMO_OFFERS : offers).map(normalizeOffer)
    ), [offers]);
    const [offerList, setOfferList] = useState(initialOffers);
    const [selectedId, setSelectedId] = useState(initialOffers[0]?.id ?? null);
    const [formValues, setFormValues] = useState(() => formValuesFromOffer(initialOffers[0]));
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [fileError, setFileError] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewOffer, setIsNewOffer] = useState(!initialOffers[0]);

    const selectedOffer = offerList.find((offer) => offer.id === selectedId) ?? null;
    const isOfferReadOnly = ["REJETE", "EN_ATTENTE"].includes(selectedOffer?.statut);
    const pendingCount = offerList.filter((offer) => offer.statut === "EN_ATTENTE").length;
    const publishedCount = offerList.filter((offer) => offer.statut === "VALIDE").length;
    const editorTitle = isNewOffer
        ? "Publier une nouvelle offre"
        : selectedOffer?.statut === "REJETE"
            ? "Offre refusée"
            : selectedOffer?.statut === "EN_ATTENTE"
                ? "Offre en attente de validation"
                : selectedOffer?.statut === "VALIDE"
                    ? "Mettre à jour une offre"
                    : "Modifier mon offre";

    useEffect(() => {
        setOfferList(initialOffers);
        setSelectedId(initialOffers[0]?.id ?? null);
        setIsNewOffer(!initialOffers[0]);
        setFormValues(formValuesFromOffer(initialOffers[0]));
    }, [initialOffers]);

    useEffect(() => {
        if (!isNewOffer) {
            setFormValues(formValuesFromOffer(selectedOffer));
            setSelectedFile(null);
            setFieldErrors({});
            setFileError("");
            setFormError("");
            setSuccessMessage("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [selectedId, isNewOffer]);

    const selectOffer = (offer) => {
        setIsNewOffer(false);
        setSelectedId(offer.id);
        window.requestAnimationFrame(() => formRef.current?.scrollIntoView({behavior: "smooth", block: "start"}));
    };

    const startNewOffer = () => {
        setIsNewOffer(true);
        setSelectedId(null);
        setFormValues({...EMPTY_FORM, nomEntreprise: companyName});
        setSelectedFile(null);
        setFieldErrors({});
        setFileError("");
        setFormError("");
        setSuccessMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        window.requestAnimationFrame(() => formRef.current?.scrollIntoView({behavior: "smooth", block: "start"}));
    };

    const updateField = (event) => {
        const {name, value} = event.target;
        setFormValues((current) => ({...current, [name]: value}));
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
            setFileError("Format invalide. Seuls les fichiers PDF (.pdf) sont acceptés.");
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            setFileError("Le fichier dépasse la taille maximale autorisée de 5 Mo.");
            return false;
        }
        setSelectedFile(file);
        return true;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!validateFile(file)) setSelectedFile(null);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!isAccountEmailValidated || isOfferReadOnly) return;
        const file = event.dataTransfer.files?.[0];
        if (!validateFile(file)) setSelectedFile(null);
    };

    const validateForm = () => {
        const errors = {};
        const requiredFields = {
            nomEntreprise: "Le nom de l’entreprise est requis.",
            position: "Le titre du stage est requis.",
            targetDiscipline: "La discipline est requise.",
            adresseEntreprise: "L’adresse de l’entreprise est requise.",
            dateDebutStage: "La date de début est requise.",
            dateFinStage: "La date de fin est requise.",
            descriptionPosition: "La description du stage est requise.",
        };

        Object.entries(requiredFields).forEach(([field, message]) => {
            if (!String(formValues[field] ?? "").trim()) errors[field] = message;
        });
        if (formValues.email && !/^\S+@\S+\.\S+$/.test(formValues.email)) {
            errors.email = "Entrez une adresse courriel valide.";
        }
        if (formValues.dateDebutStage && formValues.dateFinStage && formValues.dateFinStage < formValues.dateDebutStage) {
            errors.dateFinStage = "La date de fin doit suivre la date de début.";
        }
        if (formValues.descriptionPosition.trim().length > 0 && formValues.descriptionPosition.trim().length < 40) {
            errors.descriptionPosition = "La description doit contenir au moins 40 caractères.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");
        setFormError("");

        if (!isAccountEmailValidated) {
            setFormError("Accès refusé (403). Validez votre compte par courriel pour publier une offre de stage.");
            return;
        }
        if (isOfferReadOnly) {
            setFormError(selectedOffer?.statut === "EN_ATTENTE"
                ? "Cette offre est en attente de validation et n’est plus modifiable."
                : "Cette offre a été refusée et n’est plus modifiable.");
            return;
        }
        if (!selectedFile) {
            setFileError("Ajoutez la version PDF de l’offre avant de la soumettre.");
        }
        if (!validateForm() || !selectedFile) return;

        setIsSubmitting(true);
        const formData = buildOfferSubmissionFormData({
            file: selectedFile,
            fields: formValues,
            offerId: selectedOffer?.id,
        });

        try {
            if (onSubmit) {
                const response = await onSubmit({
                    offerId: selectedOffer?.id ?? null,
                    mode: isNewOffer ? "create" : "update",
                    fields: formValues,
                    file: selectedFile,
                    formData,
                });
                if (response?.status === 403) {
                    setFormError("Accès refusé (403). Votre compte doit être validé par courriel avant de publier une offre.");
                    return;
                }
                if (response?.ok === false) {
                    throw new Error("La soumission n’a pas pu être enregistrée.");
                }
            } else {
                await new Promise((resolve) => window.setTimeout(resolve, 650));
            }

            const submittedOffer = normalizeOffer({
                ...(selectedOffer ?? {}),
                ...formValues,
                id: selectedOffer?.id ?? `local-${Date.now()}`,
                fileName: selectedFile.name,
                statut: "EN_ATTENTE",
                commentaireRejet: "",
                version: (selectedOffer?.version ?? 0) + 1,
                updatedAt: new Date().toISOString(),
            });
            setOfferList((current) => {
                const exists = current.some((offer) => offer.id === submittedOffer.id);
                return exists
                    ? current.map((offer) => offer.id === submittedOffer.id ? submittedOffer : offer)
                    : [submittedOffer, ...current];
            });
            setSelectedId(submittedOffer.id);
            setIsNewOffer(false);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSuccessMessage(isNewOffer
                ? "Votre offre a été soumise avec succès. Elle est maintenant en attente de validation par le gestionnaire de stage."
                : "Votre nouvelle version a été soumise avec succès. Elle remplace l’ancienne et repasse en attente de validation.");
        } catch (error) {
            setFormError(error?.message || "Une erreur est survenue pendant la soumission. Réessayez plus tard.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="flex-1 bg-canvas px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <div>
                    <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-ink sm:text-3xl">Publiez vos
                        offres de stage</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">Centralisez vos offres,
                        suivez leur validation et consultez les commentaires du gestionnaire.</p>
                </div>

                {!isAccountEmailValidated && (
                    <div
                        className="mt-5 flex items-start gap-3 rounded-2xl border border-peach bg-peach/45 p-3.5 sm:p-4"
                        role="alert">
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface/80 text-ink"><Icon
                            name="shield" className="h-4 w-4"/></span>
                        <div>
                            <p className="text-sm font-black text-ink">Publication bloquée — compte non validé</p>
                            <p className="mt-1 text-sm leading-6 text-ink-soft">Validez votre adresse courriel à partir
                                du lien reçu lors de votre inscription. La publication sera disponible dès la
                                validation.</p>
                        </div>
                    </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">Mes offres</p>
                        <p className="mt-2 text-2xl font-black text-ink">{offerList.length}</p>
                        <p className="mt-1 text-sm text-ink-soft">offre{offerList.length === 1 ? "" : "s"} enregistrée{offerList.length === 1 ? "" : "s"}</p>
                    </div>
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">En validation</p>
                        <p className="mt-2 text-2xl font-black text-ink">{pendingCount}</p>
                        <p className="mt-1 text-sm text-ink-soft">à l’étude par le gestionnaire</p>
                    </div>
                    <div
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgba(48,35,55,0.05)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">Publiées</p>
                        <p className="mt-2 text-2xl font-black text-ink">{publishedCount}</p>
                        <p className="mt-1 text-sm text-ink-soft">visibles par les étudiants</p>
                    </div>
                </div>

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.82fr_1.55fr]">
                    <aside
                        className="rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">Votre
                                    espace</p>
                                <h2 className="mt-2 text-xl font-black tracking-tight text-ink">Mes offres de stage</h2>
                            </div>
                            <button type="button" onClick={startNewOffer}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50"
                                    aria-label="Publier une nouvelle offre">
                                <Icon name="plus" className="h-5 w-5"/>
                            </button>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-ink-soft">Sélectionnez une offre pour la mettre à jour
                            ou consulter son statut.</p>

                        <div className="mt-6 space-y-3">
                            {offerList.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-line bg-canvas p-5 text-center">
                                    <span
                                        className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-lavender/50 text-ink"><Icon
                                        name="file"/></span>
                                    <p className="mt-3 text-sm font-bold text-ink">Aucune offre publiée</p>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">Votre première offre sera
                                        visible ici après son enregistrement.</p>
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
                                    <p className="mt-4 line-clamp-2 text-sm font-black leading-5 text-ink">{offer.position || "Offre sans titre"}</p>
                                    <p className="mt-1 truncate text-xs text-ink-soft">{offer.fileName || "Aucun fichier"}</p>
                                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-ink-soft">
                                        <span>Version {offer.version ?? 1}</span>
                                        <span>{formatDate(offer.updatedAt)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button type="button" onClick={startNewOffer}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink bg-surface px-4 py-3 text-sm font-bold text-ink transition-colors hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40">
                            <Icon name="plus" className="h-4 w-4"/> Publier une nouvelle offre
                        </button>
                    </aside>

                    <div ref={formRef}
                         className="rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-7">
                        <div
                            className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">Téléversement
                                        et informations</p>
                                    {!isNewOffer && selectedOffer && <StatusBadge status={selectedOffer.statut}/>}
                                </div>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-ink">{editorTitle}</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{isOfferReadOnly
                                    ? selectedOffer?.statut === "EN_ATTENTE"
                                        ? "Cette offre a déjà été soumise et reste en lecture seule pendant sa validation."
                                        : "Cette offre refusée est conservée en lecture seule. Le commentaire du gestionnaire est affiché ci-dessous."
                                    : "Le gestionnaire de stage recevra votre soumission pour validation. Le statut passera automatiquement à « En attente »."}</p>
                            </div>
                            <span
                                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink/70 text-ink sm:flex"><Icon
                                name="upload"/></span>
                        </div>

                        {selectedOffer?.statut === "REJETE" && selectedOffer.commentaireRejet && (
                            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blush bg-blush/30 p-4"
                                 role="status">
                                <span
                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-error"><Icon
                                    name="info" className="h-4 w-4"/></span>
                                <div>
                                    <p className="text-sm font-black text-ink">Commentaire du gestionnaire</p>
                                    <p className="mt-1 text-sm leading-6 text-ink-soft">{selectedOffer.commentaireRejet}</p>
                                </div>
                            </div>
                        )}

                        {successMessage && <div
                            className="mt-6 flex items-start gap-3 rounded-2xl border border-[#9ed9bd] bg-[#dff6e8] p-4 text-sm text-[#245e3b]"
                            role="status" aria-live="polite"><Icon name="check" className="mt-0.5 h-5 w-5 shrink-0"/><p
                            className="font-semibold">{successMessage}</p></div>}
                        {formError && <div
                            className="mt-6 rounded-2xl border border-error bg-blush/25 p-4 text-sm font-semibold text-error"
                            role="alert">{formError}</div>}

                        <form className="mt-7 space-y-8" onSubmit={handleSubmit} noValidate>
                            <fieldset disabled={!isAccountEmailValidated || isSubmitting || isOfferReadOnly}
                                      className="space-y-8">
                                <div>
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-ink">1. Votre fichier</h3>
                                            <p className="mt-1 text-sm text-ink-soft">Un PDF de 5 Mo maximum sera
                                                analysé par le gestionnaire.</p>
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
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">Document
                                                    soumis</p>
                                                <p className="mt-1 truncate text-sm font-bold text-ink">{selectedOffer?.fileName || "Aucun fichier"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`mt-4 rounded-2xl border-2 border-dashed p-5 transition-colors sm:p-6 ${isDragging ? "border-pink bg-pink/25" : fileError ? "border-error bg-blush/15" : "border-line bg-canvas hover:border-lavender"}`}
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
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <span
                                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender/60 text-ink"><Icon
                                                    name="upload"/></span>
                                                <p className="mt-3 text-sm font-bold text-ink">{selectedFile ? "Nouveau document sélectionné" : selectedOffer?.fileName ? "Déposez un nouveau document PDF" : "Déposez votre document PDF ici"}</p>
                                                <p className="mt-1 text-sm text-ink-soft">Glissez-déposez votre nouveau
                                                    PDF ou</p>
                                                <label htmlFor="offer-file"
                                                       className="mt-2 cursor-pointer text-sm font-black text-ink underline decoration-pink decoration-4 underline-offset-4">parcourez
                                                    vos fichiers</label>
                                                <p className="mt-3 text-xs text-ink-soft">Taille maximale : 5 Mo</p>
                                            </div>
                                            {selectedFile && <div
                                                className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-lavender/45 px-3 py-2.5 text-sm"
                                                role="status"><span
                                                className="flex min-w-0 items-center gap-2 font-bold text-ink"><Icon
                                                name="file" className="h-4 w-4 shrink-0"/><span
                                                className="truncate">{selectedFile.name}</span></span><span
                                                className="shrink-0 text-xs font-semibold text-ink-soft">{formatFileSize(selectedFile.size)}</span>
                                            </div>}
                                            {!selectedFile && selectedOffer?.fileName && <div
                                                className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink-soft">
                                                <Icon name="file" className="h-4 w-4 shrink-0"/><span
                                                className="truncate">Fichier actuel : <strong
                                                className="text-ink">{selectedOffer.fileName}</strong></span></div>}
                                        </div>
                                    )}
                                    {fileError && <p className="mt-2 text-sm font-semibold text-error"
                                                     role="alert">{fileError}</p>}
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-ink">2. Informations sur le stage</h3>
                                    <p className="mt-1 text-sm text-ink-soft">Ces informations seront associées à votre
                                        offre et affichées aux étudiants après approbation.</p>
                                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                        <Field id="nomEntreprise" label="Nom de l’entreprise" required
                                               error={fieldErrors.nomEntreprise}>
                                            <input id="nomEntreprise" name="nomEntreprise"
                                                   value={formValues.nomEntreprise} onChange={updateField}
                                                   className={inputClass(fieldErrors.nomEntreprise)}
                                                   placeholder="Ex. Atelier Nord"/>
                                        </Field>
                                        <Field id="position" label="Titre du stage" required
                                               error={fieldErrors.position}>
                                            <input id="position" name="position" value={formValues.position}
                                                   onChange={updateField} className={inputClass(fieldErrors.position)}
                                                   placeholder="Ex. Stagiaire en développement web"/>
                                        </Field>
                                        <Field id="targetDiscipline" label="Discipline" required
                                               error={fieldErrors.targetDiscipline}>
                                            <select id="targetDiscipline" name="targetDiscipline"
                                                    value={formValues.targetDiscipline} onChange={updateField}
                                                    className={inputClass(fieldErrors.targetDiscipline)}>
                                                <option value="">Sélectionnez une discipline</option>
                                                {DISCIPLINES.map(([value, label]) => <option key={value}
                                                                                             value={value}>{label}</option>)}
                                            </select>
                                        </Field>
                                        <Field id="adresseEntreprise" label="Adresse de l’entreprise" required
                                               error={fieldErrors.adresseEntreprise}>
                                            <input id="adresseEntreprise" name="adresseEntreprise"
                                                   value={formValues.adresseEntreprise} onChange={updateField}
                                                   className={inputClass(fieldErrors.adresseEntreprise)}
                                                   placeholder="Ville, province"/>
                                        </Field>
                                        <Field id="dateDebutStage" label="Date de début" required
                                               error={fieldErrors.dateDebutStage}>
                                            <input id="dateDebutStage" type="date" name="dateDebutStage"
                                                   value={formValues.dateDebutStage} onChange={updateField}
                                                   className={inputClass(fieldErrors.dateDebutStage)}/>
                                        </Field>
                                        <Field id="dateFinStage" label="Date de fin" required
                                               error={fieldErrors.dateFinStage}>
                                            <input id="dateFinStage" type="date" name="dateFinStage"
                                                   value={formValues.dateFinStage} onChange={updateField}
                                                   className={inputClass(fieldErrors.dateFinStage)}/>
                                        </Field>
                                        <Field id="salaire" label="Rémunération horaire" error={fieldErrors.salaire}>
                                            <div className="relative"><input id="salaire" type="number" min="0"
                                                                             step="0.01" name="salaire"
                                                                             value={formValues.salaire}
                                                                             onChange={updateField}
                                                                             className={`${inputClass(fieldErrors.salaire)} pr-12`}
                                                                             placeholder="Ex. 22,50"/><span
                                                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-soft">$/h</span>
                                            </div>
                                        </Field>
                                    </div>
                                    <Field id="descriptionPosition" label="Description du stage" required
                                           error={fieldErrors.descriptionPosition} className="mt-5">
                                        <textarea id="descriptionPosition" name="descriptionPosition" rows="4"
                                                  value={formValues.descriptionPosition} onChange={updateField}
                                                  className={`${inputClass(fieldErrors.descriptionPosition)} resize-y`}
                                                  placeholder="Décrivez les responsabilités, les livrables attendus et les compétences recherchées."/>
                                        <p className="mt-1.5 text-right text-xs text-ink-soft">{formValues.descriptionPosition.length} caractères</p>
                                    </Field>
                                </div>

                            </fieldset>

                            <div
                                className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                                {isOfferReadOnly ? (
                                    <p className="flex items-start gap-2 text-sm font-semibold text-ink-soft"><Icon
                                        name="info" className="mt-0.5 h-4 w-4 shrink-0"/>Cette offre
                                        est {selectedOffer?.statut === "EN_ATTENTE" ? "en attente de validation" : "refusée"} et
                                        ne peut plus être modifiée.</p>
                                ) : (
                                    <>
                                        <p className="flex items-start gap-2 text-xs leading-5 text-ink-soft"><Icon
                                            name="info" className="mt-0.5 h-4 w-4 shrink-0"/>La soumission déclenche une
                                            nouvelle validation par le gestionnaire de stage.</p>
                                        <button type="submit" disabled={!isAccountEmailValidated || isSubmitting}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50">
                                            {isSubmitting ? "Soumission en cours…" : isNewOffer ? "Soumettre l’offre" : "Soumettre l’offre mise à jour"}
                                            {!isSubmitting && <Icon name="arrow" className="h-4 w-4"/>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
