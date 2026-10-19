import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api.js";
import { translateMessage } from "../../utils/i18nMessage.js";

const DEFAULT_FORM_STATE = {
    date: "",
    heure: "",
    /* duree: "30", */
    mode: "VIDEO_CALL",
    lieuOuLien: "",
    message: "",
};

export default function ScheduleInterviewModal({ offerId, candidat, initialData, onClose, onSuccess }) {
    const { t } = useTranslation();
    const [isEdit, setIsEdit] = useState(Boolean(candidat?.isEdit));
    const [submittedData, setSubmittedData] = useState(null);

    const storageKey = `interview_draft_${offerId}_${candidat?.id}`;

    const [formData, setFormData] = useState(() => {
        const savedDraft = sessionStorage.getItem(storageKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.mode === "EN_PERSONNE") parsed.mode = "IN_PERSON";
                if (parsed.mode === "VISIOCONFERENCE") parsed.mode = "VIDEO_CALL";
                return parsed;
            } catch (e) {
                // Ignorer les erreurs de parsing
            }
        }
        return initialData ?? DEFAULT_FORM_STATE;
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!isSuccess) {
            sessionStorage.setItem(storageKey, JSON.stringify(formData));
        }
    }, [formData, storageKey, isSuccess]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.date) {
            newErrors.date = t("employerOffers.interviews.errors.dateRequired", "La date est requise.");
        }
        if (!formData.heure) {
            newErrors.heure = t("employerOffers.interviews.errors.timeRequired", "L'heure est requise.");
        }
        if (!formData.mode) {
            newErrors.mode = t("employerOffers.interviews.errors.modeRequired", "Le mode est requis.");
        }
        if (!formData.lieuOuLien || !formData.lieuOuLien.trim()) {
            newErrors.lieuOuLien = t("employerOffers.interviews.errors.locationOrLinkRequired", "Le lieu ou le lien est requis.");
        }

        if (formData.date && formData.heure) {
            const selectedDateTime = new Date(`${formData.date}T${formData.heure}`);
            if (selectedDateTime <= new Date()) {
                newErrors.date = t("employerOffers.interviews.errors.dateInPast", "La date doit être située dans le futur.");
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                dateHeure: `${formData.date}T${formData.heure}:00`,
                /* dureeMinutes: parseInt(formData.duree, 10), */
                mode: formData.mode,
                lieuOuLien: formData.lieuOuLien.trim(),
                messageOptionnel: formData.message.trim(),
            };

            const call = isEdit ? api.employer.offers.modifierEntrevue : api.employer.offers.planifierEntrevue;
            const response = await call(offerId, candidat.id, payload);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.messageKey || errorData.message || "employerOffers.interviews.errors.submitFailed");
            }

            sessionStorage.removeItem(storageKey);

            setSubmittedData(formData);

            setFormData(DEFAULT_FORM_STATE);
            setErrors({});

            setIsSuccess(true);

            if (onSuccess) onSuccess(formData);
        } catch (err) {
            setServerError({ key: err.message || "employerOffers.interviews.errors.submitFailed" });
        } finally {
            setSubmitting(false);
        }
    };

    const getTodayIso = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 overflow-y-auto backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                    <h2 className="text-xl font-black text-ink">
                        {isEdit
                            ? t("employerOffers.interviews.editTitle", "Modifier l'entrevue")
                            : t("employerOffers.interviews.title", "Planifier une entrevue")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-ink-soft hover:text-ink text-lg font-bold"
                    >
                        ✕
                    </button>
                </div>

                <p className="mt-3 text-sm text-ink-soft">
                    {t("employerOffers.interviews.subtitle", "Candidat :")}{" "}
                    <span className="font-bold text-ink">{candidat?.prenom || candidat?.firstName} {candidat?.nom || candidat?.lastName || candidat?.name}</span>
                </p>

                {isSuccess ? (
                    <div className="mt-6 text-center py-6">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-ink">
                            {isEdit
                                ? t("employerOffers.interviews.success.updatedTitle", "Entrevue modifiée avec succès !")
                                : t("employerOffers.interviews.success.title", "Entrevue planifiée avec succès !")}
                        </h3>
                        <p className="mt-2 text-sm text-ink-soft">
                            {t("employerOffers.interviews.success.description", "L'invitation a été envoyée au candidat.")}
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(submittedData ?? DEFAULT_FORM_STATE);
                                    setIsEdit(true);
                                    setIsSuccess(false);
                                }}
                                className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-ink hover:bg-canvas"
                            >
                                {t("employerOffers.interviews.edit", "Modifier l'entrevue")}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft"
                            >
                                {t("common.close", "Fermer")}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {serverError && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-error">
                                {translateMessage(t, serverError)}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-bold text-ink mb-1">
                                        {t("employerOffers.interviews.date", "Date")}
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        min={getTodayIso()}
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                                    />
                                    {errors.date && <p className="mt-1 text-xs text-error">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-ink mb-1">
                                        {t("employerOffers.interviews.time", "Heure")}
                                    </label>
                                    <input
                                        type="time"
                                        name="heure"
                                        value={formData.heure}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                                    />
                                    {errors.heure && <p className="mt-1 text-xs text-error">{errors.heure}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink mb-1">
                                    {t("employerOffers.interviews.mode", "Mode d'entrevue")}
                                </label>
                                <select
                                    name="mode"
                                    value={formData.mode}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                                >
                                    <option value="VIDEO_CALL">{t("employerOffers.interviews.modes.video", "Visioconférence")}</option>
                                    {/*<option value="PHONE_CALL">{t("employerOffers.interviews.modes.phone", "Appel téléphonique")}</option>*/}
                                    <option value="IN_PERSON">{t("employerOffers.interviews.modes.inPerson", "En personne")}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink mb-1">
                                    {t("employerOffers.interviews.locationOrLink", "Lieu ou lien de la rencontre")}
                                </label>
                                <input
                                    type="text"
                                    name="lieuOuLien"
                                    value={formData.lieuOuLien}
                                    onChange={handleChange}
                                    placeholder="Ex: https://teams.microsoft.com/... ou 123 rue St-Catherine"
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                                />
                                {errors.lieuOuLien && <p className="mt-1 text-xs text-error">{errors.lieuOuLien}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink mb-1">
                                    {t("employerOffers.interviews.message", "Message optionnel")}
                                </label>
                                <textarea
                                    name="message"
                                    rows="3"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Instructions particulières..."
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender resize-none"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-line">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-ink hover:bg-canvas"
                                >
                                    {t("employerOffers.interviews.cancel", "Annuler")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft disabled:opacity-50"
                                >
                                    {submitting
                                        ? t("employerOffers.interviews.submitting", "Planification...")
                                        : isEdit
                                            ? t("employerOffers.interviews.saveChanges", "Enregistrer les modifications")
                                            : t("employerOffers.interviews.submit", "Confirmer l'entrevue")}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}