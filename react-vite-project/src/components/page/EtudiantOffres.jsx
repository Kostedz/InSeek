import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../utils/api.js";
import Loading from "../Loading.jsx";
import { translateMessage } from "../../utils/i18nMessage.js";

export default function EtudiantOffres() {
    const { t, i18n } = useTranslation();
    const [offres, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [forbidden, setForbidden] = useState(false);

    const loadOffers = async () => {
        setLoading(true);
        setError(null);
        setForbidden(false);

        try {
            const response = await api.student.getAvailableOffers();
            if (response.status === 403) {
                setForbidden(true);
                return;
            }

            if (!response.ok) throw new Error("loadFailed");

            const data = await response.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            setOffers(list);
        } catch {
            setError({ key: "employerOffers.errors.loadFailed" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

       const formatDate =(value) => {
           if (!value) return "";
           {
               return new Intl.DateTimeFormat(i18n.resolvedLanguage === "en" ? "en-US" : "fr-FR", {
                   day: "numeric",
                   month: "short",
                   year: "numeric",
               }).format(new Date(value));
           }

       };

    if (loading) return <Loading />;

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)]">
                    <h1 className="mt-2 text-2xl font-black text-ink">{t("etudiant.offres.forbiddenTitle", "Accès restreint")}</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">
                        {t("etudiant.offres.forbiddenDescription", "Votre CV doit être validé avant de consulter les offres.")}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-ink">{t("etudiant.offres.title", "Offres de stage")}</h1>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                        {t("etudiant.offres.description", "Consultez les offres de stage validées et disponibles pour votre profil.")}
                    </p>
                </div>

                {error && (
                    <p className="mt-6 rounded-xl border border-[#eab0bf] bg-[#fff0f3] px-4 py-3 text-sm font-semibold text-error" role="alert">
                        {translateMessage(t, error)}
                    </p>
                )}

                <div className="mt-8">
                    {offres.length === 0 ? (
                        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft shadow-[0_12px_30px_rgba(48,35,55,0.06)]">
                            {t("etudiant.offres.empty", "Aucune offre disponible pour le moment.")}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {offres.map((offre) => (
                                <div
                                    key={offre.id}
                                    className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6 shadow-[0_12px_30px_rgba(48,35,55,0.06)] transition-all hover:border-ink/40"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full bg-lavender/50 px-3 py-1 text-xs font-bold text-ink">
                                                {offre.nomEntreprise || offre.companyName}
                                            </span>
                                            <span className="text-xs text-ink-soft">
                                                {formatDate(offre.datePublication || offre.createdAt)}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-xl font-black text-ink">{offre.titre || offre.position}</h2>
                                        <p className="mt-2 text-sm leading-6 text-ink-soft line-clamp-3">
                                            {offre.resume || offre.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-line flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                /* Logique pour voir le détail complet (ex: navigation vers /etudiant/offres/:id ou ouverture d'un modal) */
                                            }}
                                            className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft"
                                        >
                                            {t("etudiant.offres.viewDetails", "Voir les détails")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}