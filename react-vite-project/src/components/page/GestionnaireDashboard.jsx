import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../../utils/api.js";
import ValidationTabs from "./ValidationTabs.jsx";
import { countPendingDocuments } from "../../utils/gestionnaireCounts.js";

export default function GestionnaireDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        studentsWithoutContract: 0,
        pendingOffers: 0,
        pendingCvs: 0,
        contractsCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchDashboardData() {
            try {
                const [offersCount, cvsCount, studentsRes, contractsRes] = await Promise.all([
                    countPendingDocuments("OffreDeStage"),
                    countPendingDocuments("CV"),
                    api.gestionnaire.getEligibleStudents(),
                    api.gestionnaire.getContracts(),
                ]);

                if (studentsRes.status === 403 || contractsRes.status === 403) {
                    if (isMounted) setForbidden(true);
                    return;
                }

                const studentsData = studentsRes.ok ? await studentsRes.json() : [];
                const contractsData = contractsRes.ok ? await contractsRes.json() : [];

                const studentsList = Array.isArray(studentsData) ? studentsData : studentsData.items ?? studentsData.content ?? [];
                const contractsList = Array.isArray(contractsData) ? contractsData : contractsData.items ?? contractsData.content ?? [];

                const withoutContract = studentsList.filter((s) => !s.hasContract && !s.contractExists).length;

                if (isMounted) {
                    setStats({
                        studentsWithoutContract: withoutContract,
                        pendingOffers: offersCount ?? 0,
                        pendingCvs: cvsCount ?? 0,
                        contractsCount: contractsList.length,
                    });
                }
        } catch {
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchDashboardData();
        return () => { isMounted = false; };
    }, []);

    if (forbidden) {
        return (
            <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl rounded-[2rem] border border-line bg-surface p-8 text-center shadow-sm">
                    <p className="text-sm font-bold text-error">403</p>
                    <h1 className="mt-2 text-3xl font-black text-ink">{t("managerValidation.forbiddenTitle", "Accès refusé")}</h1>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{t("managerValidation.forbiddenDescription", "Cette page est réservée aux gestionnaires de stages.")}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-ink">
                        {t("managerDashboard.title", "Tableau de bord - Gestionnaire")}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                        {t("managerDashboard.description", "Vue d'ensemble des actions en attente, contrats et validations.")}
                    </p>
                </div>

                <ValidationTabs activeTab="dashboard" offersCount={stats.pendingOffers} cvsCount={stats.pendingCvs} />

                {loading ? (
                    <div className="mt-8 py-12 text-center text-ink-soft font-medium">
                        {t("managerValidation.loading", "Chargement…")}
                    </div>
                ) : (
                    <>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <Link to="/gestionnaire/etudiants" className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-ink transition-all">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("managerDashboard.cards.studentsWithoutContract", "Sans contrat")}</p>
                                <p className="mt-2 text-3xl font-black text-ink">{stats.studentsWithoutContract}</p>
                                <p className="mt-1 text-xs text-ink-soft">{t("managerDashboard.cards.studentsDesc", "Étudiants ayant trouvé un stage")}</p>
                            </Link>

                            <Link to="/gestionnaire/offres" className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-ink transition-all">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("managerDashboard.cards.pendingOffers", "Offres à valider")}</p>
                                <p className="mt-2 text-3xl font-black text-ink">{stats.pendingOffers}</p>
                                <p className="mt-1 text-xs text-ink-soft">{t("managerDashboard.cards.offersDesc", "En attente de révision")}</p>
                            </Link>

                            <Link to="/gestionnaire/cv" className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-ink transition-all">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("managerDashboard.cards.pendingCvs", "CV à valider")}</p>
                                <p className="mt-2 text-3xl font-black text-ink">{stats.pendingCvs}</p>
                                <p className="mt-1 text-xs text-ink-soft">{t("managerDashboard.cards.cvsDesc", "Soumis par les étudiants")}</p>
                            </Link>

                            <Link to="/gestionnaire/contrats" className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-ink transition-all">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("managerDashboard.cards.contracts", "Contrats créés")}</p>
                                <p className="mt-2 text-3xl font-black text-ink">{stats.contractsCount}</p>
                                <p className="mt-1 text-xs text-ink-soft">{t("managerDashboard.cards.contractsDesc", "Ententes enregistrées")}</p>
                            </Link>
                        </div>

                        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 shadow-sm">
                            <h2 className="text-lg font-black text-ink">{t("managerDashboard.todo.title", "À faire / Actions prioritaires")}</h2>
                            <div className="mt-4 space-y-3">
                                {stats.pendingOffers > 0 && (
                                    <div className="flex items-center justify-between rounded-xl border border-line bg-canvas p-4">
                                        <p className="text-sm font-semibold text-ink">
                                            {t("managerDashboard.todo.offersAction", "{{count}} offre(s) de stage en attente de validation", { count: stats.pendingOffers })}
                                        </p>
                                        <Link to="/gestionnaire/offres" className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink-soft">
                                            {t("managerDashboard.todo.review", "Réviser")}
                                        </Link>
                                    </div>
                                )}
                                {stats.pendingCvs > 0 && (
                                    <div className="flex items-center justify-between rounded-xl border border-line bg-canvas p-4">
                                        <p className="text-sm font-semibold text-ink">
                                            {t("managerDashboard.todo.cvsAction", "{{count}} CV en attente de validation", { count: stats.pendingCvs })}
                                        </p>
                                        <Link to="/gestionnaire/cv" className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink-soft">
                                            {t("managerDashboard.todo.review", "Réviser")}
                                        </Link>
                                    </div>
                                )}
                                {stats.studentsWithoutContract > 0 && (
                                    <div className="flex items-center justify-between rounded-xl border border-line bg-canvas p-4">
                                        <p className="text-sm font-semibold text-ink">
                                            {t("managerDashboard.todo.contractsAction", "{{count}} étudiant(s) au statut 'STAGE TROUVÉ' sans contrat", { count: stats.studentsWithoutContract })}
                                        </p>
                                        <Link to="/gestionnaire/etudiants" className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink-soft">
                                            {t("managerDashboard.todo.createContract", "Créer le contrat")}
                                        </Link>
                                    </div>
                                )}
                                {stats.pendingOffers === 0 && stats.pendingCvs === 0 && stats.studentsWithoutContract === 0 && (
                                    <p className="text-sm text-ink-soft py-4 text-center">
                                        {t("managerDashboard.todo.allDone", "Aucune action urgente requise pour le moment. Tout est à jour !")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}