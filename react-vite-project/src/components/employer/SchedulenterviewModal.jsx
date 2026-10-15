import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api.js";
import { translateMessage } from "../../utils/i18nMessage.js";

export default function ScheduleInterviewModal({ offerId, candidat, onClose, onSuccess }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        date: "",
        heure: "",
        duree: "30",
        mode: "VISIOCONFERENCE",
        lieuOuLien: "",
        message: "",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.date) newErrors.date = "employerOffers.interviews.errors.dateRequired";
        if (!formData.heure) newErrors.heure = "employerOffers.interviews.errors.timeRequired";
        if (!formData.mode) newErrors.mode = "employerOffers.interviews.errors.modeRequired";
        if (!formData.lieuOuLien) newErrors.lieuOuLien = "employerOffers.interviews.errors.locationRequired";

        if (formData.date && formData.heure) {
            const selectedDateTime = new Date(`${formData.date}T${formData.heure}`);
            if (selectedDateTime <= new Date()) {
                newErrors.date = "employerOffers.interviews.errors.dateInPast";
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
                dureeMinutes: parseInt(formData.duree, 10),
                mode: formData.mode,
                lieuOuLien: formData.lieuOuLien.trim(),
                messageOptionnel: formData.message.trim(),
            };

            const response = await api.employer.offers.planifierEntrevue(offerId, candidat.id, payload);
            if (!response.ok) throw new Error("employerOffers.interviews.errors.submitFailed");

            onSuccess();
            onClose();
        } catch (err) {
            setServerError({ key: err.message || "employerOffers.interviews.errors.submitFailed" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl sm:p-8">
                <div className="flex items-center justify-between border-b border-line pb-4">
                    <h2 className="text-xl font-black text-ink">
                        {t("employerOffers.interviews.title", "Planifier une entrevue")}
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
                    {t("employerOffers.interviews.subtitle", "Candidat :")} <span className="font-bold text-ink">{candidat.prenom} {candidat.nom}</span>
                </p>

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
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                            />
                            {errors.date && <p className="mt-1 text-xs text-error">{t(errors.date)}</p>}
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
                            {errors.heure && <p className="mt-1 text-xs text-error">{t(errors.heure)}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-bold text-ink mb-1">
                                {t("employerOffers.interviews.duration", "Durée (minutes)")}
                            </label>
                            <select
                                name="duree"
                                value={formData.duree}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                            >
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">60 min</option>
                            </select>
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
                                <option value="VISIOCONFERENCE">Visioconférence</option>
                                <option value="TELEPHONE">Téléphone</option>
                                <option value="EN_PERSONNE">En personne</option>
                            </select>
                        </div>
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
                        {errors.lieuOuLien && <p className="mt-1 text-xs text-error">{t(errors.lieuOuLien)}</p>}
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
                            {submitting ? t("employerOffers.interviews.submitting", "Planification...") : t("employerOffers.interviews.submit", "Confirmer l'entrevue")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}