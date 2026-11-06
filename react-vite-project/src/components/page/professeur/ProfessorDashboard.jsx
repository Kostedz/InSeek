import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useLocation} from "react-router-dom";
import api from "../../../utils/api.js";
import ProfessorTabs from "./ProfessorTabs.jsx";

const asList = (value) => Array.isArray(value) ? value : value?.items ?? value?.content ?? [];
const personName = (person) => [person?.prenom ?? person?.firstName, person?.nom ?? person?.lastName].filter(Boolean).join(" ");
const draftKey = (id) => `inseek.professor.environment-evaluation.${id}`;
const isSigned = (student) => [student?.statutRecherche, student?.statutContrat, student?.contractStatus]
    .some((status) => String(status ?? "").toUpperCase().includes("SIGNED") || String(status ?? "").toUpperCase().includes("SIGNE"));
const defaultEvaluation = (student) => ({
    visitDate: "",
    supervision: "",
    taskFit: "",
    workEnvironment: "",
    comments: "",
    student: personName(student),
    discipline: student?.discipline ?? "",
    company: student?.nomEntreprise ?? student?.entreprise ?? "",
    employer: student?.nomEmployeur ?? student?.employeur ?? "",
    offer: student?.titreOffre ?? student?.offreDeStage ?? "",
    startDate: student?.dateDebut ?? student?.dateDebutStage ?? "",
    endDate: student?.dateFin ?? student?.dateFinStage ?? "",
});

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
    const {pathname} = useLocation();
    const activeTab = pathname.endsWith("/evaluations") ? "evaluations" : "students";
    const [students, setStudents] = useState([]);
    const [applications, setApplications] = useState({});
    const [evaluationPrefill, setEvaluationPrefill] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingApplicationsId, setLoadingApplicationsId] = useState(null);
    const [error, setError] = useState("");
    const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
    const [drafts, setDrafts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("inseek.professor.environment-evaluation.drafts") || "{}");
        } catch {
            return {};
        }
    });
    const [submitted, setSubmitted] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("inseek.professor.environment-evaluation.submitted") || "{}");
        } catch {
            return {};
        }
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [saved, setSaved] = useState(false);

    useEffect(() => localStorage.setItem("inseek.professor.environment-evaluation.drafts", JSON.stringify(drafts)), [drafts]);
    useEffect(() => localStorage.setItem("inseek.professor.environment-evaluation.submitted", JSON.stringify(submitted)), [submitted]);
    useEffect(() => {
        if (selectedEvaluationId === null) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setSelectedEvaluationId(null);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [selectedEvaluationId]);
    useEffect(() => {
        if (expandedId === null) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setExpandedId(null);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [expandedId]);

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

    const setEvaluationField = (studentId, field, value) => {
        setDrafts((current) => ({...current, [studentId]: {...current[studentId], [field]: value}}));
        setSaved(true);
        setFieldErrors((current) => ({...current, [field]: ""}));
    };
    const openEvaluation = (student) => {
        if (!submitted[student.id] && !drafts[student.id]) {
            setDrafts((current) => ({...current, [student.id]: defaultEvaluation(student)}));
        }
        setSelectedEvaluationId(student.id);
        setSaved(false);
        setFieldErrors({});
        if (evaluationPrefill[student.id]) {
            mergeEvaluationPrefill(student.id, evaluationPrefill[student.id]);
            return;
        }
        const loadPrefill = async () => {
            try {
                const response = await api.professor.getStudentApplications(student.id);
                if (!response.ok) return;
                const records = asList(await response.json());
                setApplications(current => ({...current, [student.id]: records}));
                const selected = records.find(application => String(application.statutValidation ?? "").toUpperCase() === "ACCEPTE")
                    ?? records.find(application => application.offreDeStageDTO);
                const offer = selected?.offreDeStageDTO;
                if (!offer) return;
                const prefill = {
                    company: offer.nomEntreprise ?? "",
                    employer: offer.contactName ?? "",
                    offer: offer.position ?? "",
                    startDate: offer.dateDebutStage ?? "",
                    endDate: offer.dateFinStage ?? "",
                };
                setEvaluationPrefill(current => ({...current, [student.id]: prefill}));
                mergeEvaluationPrefill(student.id, prefill);
            } catch {
                // Keep the editable fields available if the optional prefill request fails.
            }
        };
        loadPrefill();
    };
    const mergeEvaluationPrefill = (studentId, prefill) => {
        setDrafts(current => {
            const existing = current[studentId] ?? {};
            const filled = Object.fromEntries(Object.entries(prefill).filter(([key, value]) => !existing[key] && value));
            return {
                ...current,
                [studentId]: {...defaultEvaluation(students.find(item => item.id === studentId) ?? {}), ...existing, ...filled}
            };
        });
    };
    const submitEvaluation = (student) => {
        const data = drafts[student.id] ?? defaultEvaluation(student);
        const nextErrors = {};
        ["visitDate", "supervision", "taskFit", "workEnvironment"].forEach((field) => {
            if (!data[field]) nextErrors[field] = t("professorDashboard.evaluation.required", "Ce champ est obligatoire.");
        });
        const visit = data.visitDate ? new Date(`${data.visitDate}T00:00:00`) : null;
        const start = data.startDate ? new Date(`${data.startDate}T00:00:00`) : null;
        const end = data.endDate ? new Date(`${data.endDate}T00:00:00`) : null;
        if (visit && (visit > new Date(new Date().toDateString()) || (start && visit < start) || (end && visit > end))) {
            nextErrors.visitDate = t("professorDashboard.evaluation.visitDateInvalid", "La visite doit être comprise dans la période du stage et ne peut pas être dans le futur.");
        }
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        if (!window.confirm(t("professorDashboard.evaluation.confirm", "Soumettre cette évaluation? Elle ne pourra plus être modifiée."))) return;
        const record = {...data, status: "SOUMISE", submittedAt: new Date().toISOString()};
        setSubmitted((current) => ({...current, [student.id]: record}));
        setDrafts((current) => {
            const next = {...current};
            delete next[student.id];
            return next;
        });
        setSelectedEvaluationId(null);
    };
    const pendingEvaluations = students.filter(student => isSigned(student) && !submitted[student.id]).length;

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("professorDashboard.eyebrow", "Espace professeur")}</span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{activeTab === "evaluations" ? t("professorDashboard.evaluation.pageTitle", "Évaluations des milieux") : t("professorDashboard.title", "Mes étudiants")}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{activeTab === "evaluations" ? t("professorDashboard.evaluation.pageDescription", "Évaluez le milieu de stage des étudiants dont le contrat est signé et consultez les évaluations déjà soumises.") : t("professorDashboard.description", "Consultez les étudiants qui vous sont assignés et suivez l’état de leurs demandes de stage.")}</p>
                </header>
                <ProfessorTabs activeTab={activeTab} pendingCount={pendingEvaluations}/>

                {activeTab === "evaluations" &&
                    <section className="mt-7 rounded-[1.5rem] border border-line bg-surface p-5 shadow-sm sm:p-6"
                             aria-label={t("professorDashboard.evaluation.sectionTitle", "Évaluation du milieu de stage")}>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div><p
                                className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{t("professorDashboard.evaluation.eyebrow", "Suivi de stage")}</p>
                                <h2 className="mt-1 text-xl font-black text-ink">{t("professorDashboard.evaluation.sectionTitle", "Évaluation du milieu de stage")}</h2>
                            </div>
                            <span
                                className="rounded-full bg-peach/50 px-3 py-1.5 text-sm font-black text-ink">{pendingEvaluations} {t("professorDashboard.evaluation.remaining", "à évaluer")}</span>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {students.filter(s => isSigned(s) || submitted[s.id]).map((student) => {
                                const complete = submitted[student.id];
                                const open = selectedEvaluationId === student.id;
                                const data = complete ?? drafts[student.id] ?? defaultEvaluation(student);
                                const field = (name, label, type = "textarea", className = "") => <label
                                    className={`block text-sm font-bold text-ink ${className}`} key={name}>
                                    {type === "range" ? <><span
                                        className="flex items-center justify-between gap-3"><span>{label}</span><span
                                        className="shrink-0 rounded-full bg-lavender/40 px-3 py-1 text-xs font-black text-ink">{data[name] ? `${data[name]} / 5` : t("professorDashboard.evaluation.ratingChoose", "Choisir une note")}</span></span><input
                                        type="range" min="1" max="5" step="0.5" disabled={Boolean(complete)}
                                        value={data[name] || "3"}
                                        onChange={e => setEvaluationField(student.id, name, e.target.value)}
                                        aria-label={label}
                                        className="mt-0.5 block h-5 w-full cursor-pointer accent-ink disabled:cursor-default"/><span
                                        className="flex items-center justify-between gap-2 text-[10px] font-bold text-ink-soft"><span
                                        className="rounded-full bg-canvas px-2.5 py-1">{t("professorDashboard.evaluation.ratingLow", "1 · À améliorer")}</span><span
                                        className="rounded-full bg-canvas px-2.5 py-1">{t("professorDashboard.evaluation.ratingHigh", "5 · Excellent")}</span></span></> : <>{label}{type === "date" ?
                                        <input type="date" disabled={Boolean(complete)} value={data[name] || ""}
                                               onChange={e => setEvaluationField(student.id, name, e.target.value)}
                                               className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 font-normal"/> :
                                        <textarea rows="4" disabled={Boolean(complete)} value={data[name] || ""}
                                                  onChange={e => setEvaluationField(student.id, name, e.target.value)}
                                                  className="mt-1.5 w-full resize-y rounded-xl border border-line bg-white px-3 py-3 font-normal"/>}</>}
                                    {fieldErrors[name] && !complete && <span
                                        className="mt-1 block text-xs font-semibold text-error">{fieldErrors[name]}</span>}</label>;
                                return <article key={student.id}
                                                className="overflow-hidden rounded-xl border border-line bg-canvas/50">
                                    <div
                                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div><h3
                                            className="font-black">{personName(student) || t("professorDashboard.student", "Étudiant")}</h3>
                                            <p className="mt-1 text-sm text-ink-soft">{student.nomEntreprise ?? student.entreprise ?? t("professorDashboard.evaluation.companyPending", "Entreprise à confirmer")}{student.statutRecherche && ` · ${t(`professorDashboard.studentStatuses.${String(student.statutRecherche).toUpperCase()}`, {defaultValue: student.statutRecherche})}`}</p>
                                        </div>
                                        <button type="button" onClick={() => openEvaluation(student)}
                                                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">{complete ? t("professorDashboard.evaluation.view", "Voir l’évaluation") : t("professorDashboard.evaluation.start", "Évaluer le milieu de stage")}</button>
                                    </div>
                                    {open && <div
                                        className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                                        role="presentation"
                                        onMouseDown={event => event.target === event.currentTarget && setSelectedEvaluationId(null)}>
                                        <section role="dialog" aria-modal="true"
                                                 aria-labelledby="environment-evaluation-title"
                                                 className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-canvas shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]">
                                            <header
                                                className="shrink-0 border-b border-line bg-surface px-5 py-5 sm:px-8 sm:py-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("professorDashboard.evaluation.eyebrow", "Suivi de stage")}</p>
                                                        <h2 id="environment-evaluation-title"
                                                            className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{t("professorDashboard.evaluation.sectionTitle", "Évaluation du milieu de stage")}</h2>
                                                    </div>
                                                    <div
                                                        className="flex max-w-[45%] shrink-0 items-center gap-2 sm:max-w-none sm:gap-3">
                                                        <p className="max-w-full truncate rounded-full border border-lavender bg-lavender/35 px-3 py-2 text-right text-xs font-black text-ink sm:text-sm">{personName(student) || t("professorDashboard.student", "Étudiant")}</p>
                                                        <button type="button"
                                                                aria-label={t("professorDashboard.evaluation.closeModal", "Fermer l’évaluation")}
                                                                onClick={() => setSelectedEvaluationId(null)}
                                                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40">×
                                                        </button>
                                                    </div>
                                                </div>
                                            </header>
                                            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
                                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-black tracking-tight text-ink">{t("professorDashboard.evaluation.internshipInfo", "Renseignements sur le stage")}</h3>
                                                    </div>
                                                    {complete && <span
                                                        className="rounded-full bg-lavender/40 px-3 py-1.5 text-xs font-black text-ink">{t("professorDashboard.evaluation.submittedStatus", "Soumise")}</span>}
                                                </div>
                                                <section
                                                    className="rounded-2xl border border-line bg-canvas p-3 sm:p-4">
                                                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                                        <div
                                                            className="rounded-xl border border-line bg-surface p-4 lg:col-span-3">
                                                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("professorDashboard.evaluation.company", "Entreprise")}</dt>
                                                            <dd className="mt-1.5 text-base font-black text-ink">{data.company || t("professorDashboard.evaluation.companyPending", "Entreprise à confirmer")}</dd>
                                                        </div>
                                                        <div
                                                            className="rounded-xl border border-line bg-surface p-4 lg:col-span-3">
                                                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("professorDashboard.evaluation.discipline", "Discipline")}</dt>
                                                            <dd className="mt-1.5 text-sm font-semibold text-ink">{data.discipline || student.discipline || "—"}</dd>
                                                        </div>
                                                        <div
                                                            className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
                                                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("professorDashboard.evaluation.employer", "Superviseur d’entreprise")}</dt>
                                                            <dd className="mt-1.5 text-sm font-semibold text-ink">{data.employer || "—"}</dd>
                                                        </div>
                                                        <div
                                                            className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
                                                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("professorDashboard.evaluation.offer", "Offre de stage")}</dt>
                                                            <dd className="mt-1.5 text-sm font-semibold text-ink">{data.offer || "—"}</dd>
                                                        </div>
                                                        <div
                                                            className="rounded-xl border border-line bg-surface p-4 sm:col-span-2 lg:col-span-2">
                                                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("professorDashboard.evaluation.period", "Période du stage")}</dt>
                                                            <dd className="mt-1.5 text-sm font-semibold text-ink">{[data.startDate, data.endDate].filter(Boolean).join(" – ") || "—"}</dd>
                                                        </div>
                                                    </dl>
                                                </section>
                                                {complete &&
                                                    <p className="mt-4 rounded-xl border border-lavender bg-lavender/20 p-4 text-sm font-bold text-ink">{t("professorDashboard.evaluation.submitted", "Soumise le")} {new Date(complete.submittedAt).toLocaleString()}</p>}
                                                <section className="mt-6">
                                                    <div className="mb-4"><p
                                                        className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{t("professorDashboard.evaluation.reviewSection", "Visite et appréciation")}</p>
                                                        <h3 className="mt-1 text-xl font-black text-ink">{t("professorDashboard.evaluation.reviewTitle", "Évaluation du milieu")}</h3>
                                                    </div>
                                                    <div
                                                        className="grid gap-4">{field("visitDate", t("professorDashboard.evaluation.visitDate", "Date de visite"), "date")}
                                                        <div
                                                            className="rounded-2xl border border-line bg-white px-4 sm:px-5">
                                                            <div
                                                                className="divide-y divide-line">{field("supervision", t("professorDashboard.evaluation.supervision", "Qualité de l’encadrement"), "range", "py-2.5")}{field("taskFit", t("professorDashboard.evaluation.taskFit", "Conformité des tâches avec l’offre"), "range", "py-2.5")}{field("workEnvironment", t("professorDashboard.evaluation.workEnvironment", "Conditions et environnement de travail"), "range", "py-2.5")}</div>
                                                        </div>
                                                        {field("comments", t("professorDashboard.evaluation.comments", "Commentaires généraux"), "textarea")}
                                                    </div>
                                                </section>
                                            </div>
                                            {!complete && <footer
                                                className="sticky bottom-0 flex shrink-0 flex-col gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                                                <div><p
                                                    className="text-xs font-bold text-ink-soft">{saved ? t("professorDashboard.evaluation.saved", "Brouillon sauvegardé sur cet appareil") : t("professorDashboard.evaluation.autoSave", "Le brouillon est sauvegardé automatiquement.")}</p>
                                                </div>
                                                <button type="button" onClick={() => submitEvaluation(student)}
                                                        className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-soft">{t("professorDashboard.evaluation.submit", "Soumettre l’évaluation")}</button>
                                            </footer>}
                                        </section>
                                    </div>}
                                </article>;
                            })}
                            {!students.some(s => isSigned(s) || submitted[s.id]) &&
                                <p className="rounded-xl bg-canvas p-4 text-sm text-ink-soft">{t("professorDashboard.evaluation.none", "Aucun étudiant avec un contrat signé à évaluer pour le moment.")}</p>}
                        </div>
                    </section>}

                {error &&
                    <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
                       role="alert">{error}</p>}
                {activeTab === "students" && (loading ?
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
                                    {isExpanded && <div
                                        className="fixed inset-0 z-[85] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
                                        role="presentation"
                                        onMouseDown={event => event.target === event.currentTarget && setExpandedId(null)}>
                                        <section
                                            className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                                            role="dialog" aria-modal="true"
                                            aria-labelledby="professor-applications-title">
                                            <header
                                                className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-5 py-5 sm:px-7">
                                                <div className="min-w-0"><p
                                                    className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("professorDashboard.eyebrow", "Espace professeur")}</p>
                                                    <h2 id="professor-applications-title"
                                                        className="mt-1 text-2xl font-black tracking-tight text-ink">{t("professorDashboard.applicationsTitle", "Demandes de stage")}</h2>
                                                    <p className="mt-1 text-sm font-semibold text-ink-soft">{personName(student) || t("professorDashboard.student", "Étudiant")}</p>
                                                </div>
                                                <button type="button" onClick={() => setExpandedId(null)}
                                                        aria-label={t("professorDashboard.applicationsClose", "Fermer les demandes")}
                                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40">×
                                                </button>
                                            </header>
                                            <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4 sm:p-6">
                                                {loadingApplicationsId === student.id ?
                                                    <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-soft">{t("professorDashboard.loadingApplications", "Chargement des demandes…")}</p> : error ?
                                                        <p role="alert"
                                                           className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : requests?.length ?
                                                            <div className="grid gap-3">{requests.map(application => {
                                                                const offer = application.offreDeStageDTO ?? {};
                                                                return <article key={application.id}
                                                                                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                                                    <div className="min-w-0"><p
                                                                        className="font-black text-ink">{offer.position || offer.nomEntreprise || t("professorDashboard.application", "Demande de stage")}</p>{offer.nomEntreprise &&
                                                                        <p className="mt-1 text-sm font-semibold text-ink-soft">{offer.nomEntreprise}</p>}
                                                                        <p className="mt-2 text-xs text-ink-soft">{t("professorDashboard.appliedOn", "Date de la demande")}: {application.dateApplique || "—"}</p>
                                                                    </div>
                                                                    <span
                                                                        className="inline-flex w-fit shrink-0 rounded-full bg-lavender/35 px-3 py-1.5 text-xs font-black text-ink">{statusLabel(application.statutValidation, t)}</span>
                                                                </article>;
                                                            })}</div> :
                                                            <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-soft">{t("professorDashboard.noApplications", "Aucune demande de stage pour cet étudiant.")}</p>}
                                            </div>
                                        </section>
                                    </div>}
                                </article>;
                            })}
                        </div>
                    ))}
            </div>
        </section>
    );
}
