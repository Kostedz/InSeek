import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../utils/api.js";
import { translateMessage } from "../../utils/i18nMessage.js";

const ERROR_DEFAULTS = {
    startDateRequired: "La date de début est requise.",
    startDateInPast: "La date de début ne peut pas être dans le passé.",
    endDateRequired: "La date de fin est requise.",
    endDateBeforeStart: "La date de fin doit être postérieure à la date de début.",
    scheduleRequired: "L'horaire est requis.",
    weeklyHoursInvalid: "Le nombre d'heures doit être supérieur à 0.",
    locationRequired: "Le lieu du stage est requis.",
    remunerationInvalid: "La rémunération ne peut pas être négative.",
};

const INITIAL_FORM_STATE = {
    studentName: "",
    discipline: "",
    companyName: "",
    employerName: "",
    offerTitle: "",
    supervisorName: "",
    assignedTeacherName: "",
    startDate: "",
    endDate: "",
    schedule: "",
    weeklyHours: "",
    remuneration: "",
    location: "",
};

const INPUT_CLASS = "w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink outline-none focus:border-lavender";

function getTodayIso() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
}

function toDateInput(value) {
    return value ? String(value).slice(0, 10) : "";
}

export default function ContractCreationModal({ student, onClose, onSuccess }) {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const errorText = (code) => t(`contracts.errors.${code}`, ERROR_DEFAULTS[code]);

    useEffect(() => {
        let isMounted = true;

        async function loadPreFillData() {
            try {
                const response = await api.gestionnaire.getContractData(student?.id, student?.offerId);
                if (!response.ok) throw new Error("contracts.errors.failedToLoadPreFill");
                const data = await response.json();

                if (!isMounted) return;
                setFormData((prev) => ({
                    ...prev,
                    studentName: data.studentName || [student?.firstName, student?.lastName].filter(Boolean).join(" "),
                    discipline: data.fieldOfStudy || "",
                    companyName: data.companyName || "",
                    employerName: data.employerName || "",
                    offerTitle: data.offerTitle || "",
                    supervisorName: data.supervisorName || "",
                    assignedTeacherName: data.assignedTeacherName || "",
                    startDate: toDateInput(data.internshipStartDate),
                    endDate: toDateInput(data.internshipEndDate),
                    schedule: data.schedule || "09:00 - 17:00",
                    weeklyHours: data.weeklyHours ? String(data.weeklyHours) : "35",
                    remuneration: data.hourlySalary ?? "",
                    location: data.location || "",
                }));
            } catch (err) {
                if (isMounted) {
                    setLoadFailed(true);
                    setServerError({ key: "contracts.errors.failedToLoadPreFill" });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadPreFillData();
        return () => {
            isMounted = false;
        };
    }, [student?.id]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose, submitting]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const errors = {};
        const today = getTodayIso();

        if (!formData.startDate) {
            errors.startDate = "startDateRequired";
        } else if (formData.startDate < today) {
            errors.startDate = "startDateInPast";
        }

        if (!formData.endDate) {
            errors.endDate = "endDateRequired";
        } else if (formData.startDate && formData.endDate <= formData.startDate) {
            errors.endDate = "endDateBeforeStart";
        }

        if (!formData.schedule || !formData.schedule.trim()) {
            errors.schedule = "scheduleRequired";
        }

        const hours = Number(formData.weeklyHours);
        if (!formData.weeklyHours || Number.isNaN(hours) || hours <= 0) {
            errors.weeklyHours = "weeklyHoursInvalid";
        }

        if (!formData.location || !formData.location.trim()) {
            errors.location = "locationRequired";
        }

        if (formData.remuneration !== "" && (Number.isNaN(Number(formData.remuneration)) || Number(formData.remuneration) < 0)) {
            errors.remuneration = "remunerationInvalid";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                studentId: student.id,
                offerId: student.offerId,
                internshipStartingDate: formData.startDate,
                internshipEndingDate: formData.endDate,
                weeklyHours: Number(formData.weeklyHours),
                hourlySalary: formData.remuneration === "" ? 0 : Number(formData.remuneration),
                internshipLocation: formData.location.trim(),
            };

            const response = await api.gestionnaire.createContract(payload);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.messageKey || errorData.message || "contracts.errors.creationFailed");
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setServerError({ key: err.message || "contracts.errors.creationFailed" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-4 overflow-y-auto"
            role="presentation"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="contract-creation-title"
            >
                <div className="flex items-center justify-between border-b border-line p-5 sm:p-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                            {t("contracts.createLabel", "Gestionnaire de Stage")}
                        </p>
                        <h2 id="contract-creation-title" className="text-xl font-black text-ink">
                            {t("contracts.createTitle", "Créer le contrat de stage")}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label={t("common.close", "Fermer")}
                        className="rounded-xl border border-line p-2 text-ink-soft hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
                    {serverError && (
                        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                            {translateMessage(t, serverError)}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 text-center text-ink-soft font-medium">
                            {t("common.loading", "Chargement des informations...")}
                        </div>
                    ) : loadFailed ? (
                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-canvas transition-colors"
                            >
                                {t("common.close", "Fermer")}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            <div className="rounded-2xl border border-line bg-canvas p-4 space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
                                    {t("contracts.preFilledSection", "Informations de l'offre et des parties")}
                                </h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.student", "Étudiant")}</span>
                                        <span className="font-bold text-ink">{formData.studentName || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.discipline", "Discipline")}</span>
                                        <span className="font-bold text-ink">{formData.discipline || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.company", "Entreprise")}</span>
                                        <span className="font-bold text-ink">{formData.companyName || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.employer", "Employeur")}</span>
                                        <span className="font-bold text-ink">{formData.employerName || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.offer", "Offre de stage")}</span>
                                        <span className="font-bold text-ink">{formData.offerTitle || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-ink-soft">{t("contracts.supervisor", "Superviseur d'entreprise")}</span>
                                        <span className="font-bold text-ink">{formData.supervisorName || "—"}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="block text-xs text-ink-soft">{t("contracts.assignedTeacher", "Professeur assigné")}</span>
                                        <span className="font-bold text-ink">{formData.assignedTeacherName || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                                    {t("contracts.conditionsSection", "Modalités du stage")}
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contract-startDate" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.startDate", "Date de début")} <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="contract-startDate"
                                            type="date"
                                            name="startDate"
                                            min={getTodayIso()}
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.startDate && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.startDate)}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="contract-endDate" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.endDate", "Date de fin")} <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="contract-endDate"
                                            type="date"
                                            name="endDate"
                                            min={formData.startDate || getTodayIso()}
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.endDate && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.endDate)}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contract-schedule" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.schedule", "Horaire de travail")} <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="contract-schedule"
                                            type="text"
                                            name="schedule"
                                            placeholder={t("contracts.placeholders.schedule", "Ex. : de 9 h à 17 h du lundi au vendredi")}
                                            value={formData.schedule}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.schedule && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.schedule)}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="contract-weeklyHours" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.weeklyHours", "Heures par semaine")} <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="contract-weeklyHours"
                                            type="number"
                                            name="weeklyHours"
                                            min="1"
                                            placeholder={t("contracts.placeholders.weeklyHours", "Ex. : 35")}
                                            value={formData.weeklyHours}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.weeklyHours && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.weeklyHours)}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contract-location" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.location", "Lieu du stage")} <span aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            id="contract-location"
                                            type="text"
                                            name="location"
                                            placeholder={t("contracts.placeholders.location", "Adresse ou mode hybride / télétravail")}
                                            value={formData.location}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.location && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.location)}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="contract-remuneration" className="block text-xs font-bold text-ink mb-1">
                                            {t("contracts.remuneration", "Rémunération ($ / heure)")}
                                        </label>
                                        <input
                                            id="contract-remuneration"
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            name="remuneration"
                                            placeholder={t("contracts.placeholders.remuneration", "Ex. : 20,50 (laisser vide si non rémunéré)")}
                                            value={formData.remuneration}
                                            onChange={handleChange}
                                            className={INPUT_CLASS}
                                        />
                                        {fieldErrors.remuneration && <p className="mt-1 text-xs font-semibold text-rose-600">{errorText(fieldErrors.remuneration)}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-line">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="w-full sm:w-auto rounded-xl border border-line px-5 py-3 text-sm font-bold text-ink hover:bg-canvas transition-colors disabled:opacity-50"
                                >
                                    {t("common.cancel", "Annuler")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink-soft transition-colors disabled:opacity-50"
                                >
                                    {submitting
                                        ? t("common.saving", "Enregistrement...")
                                        : t("contracts.saveContract", "Enregistrer le contrat")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}