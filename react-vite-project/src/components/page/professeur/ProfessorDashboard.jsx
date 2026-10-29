import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";

const asList = (value) => Array.isArray(value) ? value : value?.items ?? value?.content ?? [];
const personName = (person) => [person?.prenom ?? person?.firstName, person?.nom ?? person?.lastName].filter(Boolean).join(" ");

function statusLabel(status, t) {
    const normalized = String(status ?? "").toUpperCase();
    const labels = {
        EN_ATTENTE: "professorDashboard.status.pending",
        VALIDE: "professorDashboard.status.approved",
        ACCEPTE: "professorDashboard.status.accepted",
        REJETE: "professorDashboard.status.rejected",
    };
    return normalized ? t(labels[normalized] ?? "professorDashboard.status.unknown", {
        status: normalized,
        defaultValue: normalized
    }) : t("professorDashboard.status.unknown", "Statut inconnu");
}

export default function ProfessorDashboard() {
    const {t} = useTranslation();
    const [students, setStudents] = useState([]);
    const [applications, setApplications] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingApplicationsId, setLoadingApplicationsId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.professor.getStudents().then(async (response) => {
            if (!response.ok) throw new Error("load_failed");
            const list = asList(await response.json());
            if (active) setStudents(list);
        }).catch(() => {
            if (active) setError(t("professorDashboard.errors.students", "Impossible de charger la liste de vos étudiants."));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [t]);

    const toggleApplications = async (student) => {
        if (expandedId === student.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(student.id);
        if (applications[student.id]) return;
        setLoadingApplicationsId(student.id);
        setError("");
        try {
            const response = await api.professor.getStudentApplications(student.id);
            if (!response.ok) throw new Error("load_failed");
            const data = asList(await response.json());
            setApplications((current) => ({...current, [student.id]: data}));
        } catch {
            setError(t("professorDashboard.errors.applications", "Impossible de charger les demandes de cet étudiant."));
        } finally {
            setLoadingApplicationsId(null);
        }
    };

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("professorDashboard.eyebrow", "Espace professeur")}</span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t("professorDashboard.title", "Mes étudiants")}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{t("professorDashboard.description", "Consultez les étudiants qui vous sont assignés et suivez l’état de leurs demandes de stage.")}</p>
                </header>

                {error &&
                    <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
                       role="alert">{error}</p>}
                {loading ?
                    <p className="py-14 text-center text-sm font-medium text-ink-soft">{t("professorDashboard.loading", "Chargement de vos étudiants…")}</p> : students.length === 0 ? (
                        <div className="mt-8 rounded-[1.75rem] border border-line bg-surface p-8 text-center shadow-sm">
                            <h2 className="text-lg font-black text-ink">{t("professorDashboard.emptyTitle", "Aucun étudiant assigné")}</h2>
                            <p className="mt-2 text-sm leading-6 text-ink-soft">{t("professorDashboard.emptyDescription", "Les étudiants qui vous seront assignés par le gestionnaire apparaîtront ici.")}</p>
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-4">
                            {students.map((student) => {
                                const isExpanded = expandedId === student.id;
                                const requests = applications[student.id];
                                return <article key={student.id}
                                                className="overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-sm">
                                    <div
                                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                        <div>
                                            <h2 className="text-lg font-black text-ink">{personName(student) || t("professorDashboard.student", "Étudiant")}</h2>
                                            <p className="mt-1 text-sm text-ink-soft">{student.email}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {student.discipline && <span
                                                    className="rounded-full bg-lavender/35 px-3 py-1 text-xs font-bold text-ink">{t("professorDashboard.discipline", "Discipline")} : {t(`employerOffers.disciplines.${String(student.discipline).toUpperCase()}`, {defaultValue: student.discipline})}</span>}
                                                {student.statutRecherche && <span
                                                    className="rounded-full bg-canvas px-3 py-1 text-xs font-bold text-ink-soft">{t("professorDashboard.searchStatus", "Recherche")}: {t(`professorDashboard.studentStatuses.${String(student.statutRecherche).toUpperCase()}`, {defaultValue: t("professorDashboard.status.unknown", "Statut inconnu")})}</span>}
                                            </div>
                                        </div>
                                        <button type="button" aria-expanded={isExpanded}
                                                onClick={() => toggleApplications(student)}
                                                className="shrink-0 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-soft">
                                            {isExpanded ? t("professorDashboard.hideApplications", "Masquer les demandes") : t("professorDashboard.viewApplications", "Voir les demandes")}
                                        </button>
                                    </div>
                                    {isExpanded && <div className="border-t border-line bg-canvas/60 p-5 sm:p-6">
                                        <h3 className="font-black text-ink">{t("professorDashboard.applicationsTitle", "Demandes de stage")}</h3>
                                        {loadingApplicationsId === student.id ?
                                            <p className="mt-4 text-sm text-ink-soft">{t("professorDashboard.loadingApplications", "Chargement des demandes…")}</p> : requests?.length ? (
                                                    <div className="mt-4 grid gap-3">
                                                        {requests.map((application) => {
                                                            const offer = application.offreDeStageDTO ?? {};
                                                            return <div key={application.id}
                                                                        className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="font-bold text-ink">{offer.position || offer.nomEntreprise || t("professorDashboard.application", "Demande de stage")}</p>
                                                                    {offer.nomEntreprise &&
                                                                        <p className="mt-1 text-sm text-ink-soft">{offer.nomEntreprise}</p>}
                                                                    <p className="mt-1 text-xs text-ink-soft">{t("professorDashboard.appliedOn", "Date de la demande")}: {application.dateApplique || "—"}</p>
                                                                </div>
                                                                <span
                                                                    className="inline-flex w-fit rounded-full bg-lavender/35 px-3 py-1.5 text-xs font-black text-ink">{statusLabel(application.statutValidation, t)}</span>
                                                            </div>;
                                                        })}
                                                    </div>
                                                ) :
                                                <p className="mt-3 text-sm text-ink-soft">{t("professorDashboard.noApplications", "Aucune demande de stage pour cet étudiant.")}</p>}
                                    </div>}
                                </article>;
                            })}
                        </div>
                    )}
            </div>
        </section>
    );
}
