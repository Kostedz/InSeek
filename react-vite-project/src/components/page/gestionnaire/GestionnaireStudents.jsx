import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";

const asList = (value) => Array.isArray(value) ? value : value?.items ?? value?.content ?? value?.sessions ?? [];
const fullName = (student) => [student?.prenom ?? student?.firstName, student?.nom ?? student?.lastName].filter(Boolean).join(" ");
const valueOf = (object, ...keys) => keys.map((key) => object?.[key]).find((value) => value !== undefined && value !== null && value !== "");
const sessionLabel = (session) => valueOf(session, "label", "nom", "name", "libelle") ?? "";
const sessionId = (session) => valueOf(session, "id", "sessionId", "code") ?? sessionLabel(session);
const statusOf = (student) => String(valueOf(student, "statutRecherche", "statutRechercheEtudiant", "researchStatus", "status", "statut") ?? "").toUpperCase();
const FALLBACK_SESSIONS = (date) => {
    const currentYear = date.getFullYear();
    const latestTerm = date.getMonth() < 4 ? ["HIVER", currentYear]
        : date.getMonth() < 8 ? ["ETE", currentYear]
            : ["AUTOMNE", currentYear];
    const termOrder = ["HIVER", "ETE", "AUTOMNE"];
    const sessions = [];
    let [term, year] = latestTerm;
    for (let index = 0; index < 6; index += 1) {
        sessions.push({
            id: `${term}-${year}`,
            label: `${term === "ETE" ? "Été" : term[0] + term.slice(1).toLocaleLowerCase()} ${year}`
        });
        const termIndex = termOrder.indexOf(term);
        if (termIndex === 0) year -= 1;
        term = termOrder[(termIndex + termOrder.length - 1) % termOrder.length];
    }
    return sessions;
};

export default function GestionnaireStudents({embedded = false}) {
    const {t} = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [students, setStudents] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [sessionsUnavailable, setSessionsUnavailable] = useState(false);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [programFilter, setProgramFilter] = useState("all");
    const [assignmentFilter, setAssignmentFilter] = useState("all");
    const loadSequence = useRef(0);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await api.gestionnaire.getAcademicSessions();
                if (!response.ok) throw new Error("sessions_unavailable");
                const list = asList(await response.json());
                if (!list.length) throw new Error("sessions_empty");
                if (!mounted) return;
                setSessions(list);
                const active = list.find((session) => session.active || session.isActive || session.current || session.activeNow);
                setSelectedSessionId(String(sessionId(active ?? list[0])));
            } catch {
                if (!mounted) return;
                const fallback = FALLBACK_SESSIONS(new Date());
                setSessions(fallback);
                setSessionsUnavailable(true);
                setSelectedSessionId(String(sessionId(fallback[0])));
            } finally {
                if (mounted) setLoadingSessions(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const loadStudents = useCallback(async (id) => {
        if (!id) return;
        const sequence = ++loadSequence.current;
        setLoadingStudents(true);
        setError(false);
        try {
            const response = await api.gestionnaire.getStudentsBySession(id);
            if (!response.ok) throw new Error("students_unavailable");
            const data = asList(await response.json());
            if (sequence === loadSequence.current) setStudents(data);
        } catch {
            if (sequence === loadSequence.current) {
                setStudents([]);
                setError(true);
            }
        } finally {
            if (sequence === loadSequence.current) setLoadingStudents(false);
        }
    }, []);

    useEffect(() => {
        if (!loadingSessions && selectedSessionId) loadStudents(selectedSessionId);
    }, [loadingSessions, selectedSessionId, loadStudents]);

    const statuses = useMemo(() => [...new Set(students.map(statusOf).filter(Boolean))], [students]);
    const programs = useMemo(() => [...new Set(students.map((student) => valueOf(student, "discipline", "programme", "program", "programName")).filter(Boolean))].sort(), [students]);
    const filteredStudents = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return students.filter((student) => {
            const name = fullName(student).toLocaleLowerCase();
            const email = String(valueOf(student, "email", "courriel") ?? "").toLocaleLowerCase();
            const status = statusOf(student);
            const program = valueOf(student, "discipline", "programme", "program", "programName");
            const professorId = valueOf(student, "professeurId", "professorId", "tuteurId");
            const professor = valueOf(student, "professeurNom", "professorName", "professeur", "professor");
            const assigned = Boolean(professorId || professor);
            return (!query || `${name} ${email}`.includes(query))
                && (statusFilter === "all" || status === statusFilter)
                && (programFilter === "all" || String(program) === programFilter)
                && (assignmentFilter === "all" || (assignmentFilter === "assigned" ? assigned : !assigned));
        });
    }, [students, search, statusFilter, programFilter, assignmentFilter]);

    const selectedSession = sessions.find((session) => String(sessionId(session)) === selectedSessionId);
    const selectedLabel = sessionLabel(selectedSession) || selectedSessionId;

    return (
        <section className={embedded ? "mt-8 w-full" : "flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"}>
            <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl"}>
                {!embedded && <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("managerDashboard.eyebrow", "Espace gestionnaire")}
                    </span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t("managerStudents.title", "Gestion des étudiants")}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{t("managerStudents.description", "Suivez les cohortes étudiantes par session et consultez leur avancement vers un stage.")}</p>
                </header>}

                <section aria-label={t("managerStudents.cohort", "Cohorte étudiante")}
                         className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-ink">{t("managerStudents.cohortTitle", "Cohorte étudiante")}</h2>
                            <p className="mt-1 text-sm text-ink-soft">{t("managerStudents.cohortDescription", "Consultez tous les étudiants inscrits au processus de stage.")}</p>
                        </div>
                        <label className="w-full lg:max-w-xs">
                            <span
                                className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-soft">{t("managerStudents.session", "Session du Cégep")}</span>
                            <select value={selectedSessionId} disabled={loadingSessions || sessions.length === 0}
                                    onChange={(event) => setSelectedSessionId(event.target.value)}
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-lavender disabled:opacity-60">
                                {sessions.map((session) => <option key={sessionId(session)}
                                                                   value={sessionId(session)}>{sessionLabel(session)}</option>)}
                            </select>
                        </label>
                    </div>

                    {sessionsUnavailable &&
                        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                           role="status">
                            {t("managerStudents.sessionsFallback", "Les sessions n’ont pas pu être chargées. La session la plus récente est sélectionnée.")}
                        </p>}
                    {error &&
                        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
                           role="alert">
                            {t("managerStudents.errors.loadFailed", "Impossible de charger la liste des étudiants.")}
                        </p>}

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="sm:col-span-2 xl:col-span-1">
                            <span
                                className="sr-only">{t("managerStudents.searchPlaceholder", "Rechercher par nom, prénom ou courriel")}</span>
                            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                                   placeholder={t("managerStudents.searchPlaceholder", "Rechercher par nom, prénom ou courriel")}
                                   className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"/>
                        </label>
                        <label>
                            <span className="sr-only">{t("managerStudents.filterStatus", "Filtrer par statut")}</span>
                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender">
                                <option value="all">{t("managerStudents.allStatuses", "Tous les statuts")}</option>
                                {statuses.map((status) => <option key={status}
                                                                  value={status}>{t(`managerStudents.statuses.${status}`, {defaultValue: status.replaceAll("_", " ").toLocaleLowerCase()})}</option>)}
                            </select>
                        </label>
                        <label>
                            <span
                                className="sr-only">{t("managerStudents.filterProgram", "Filtrer par programme")}</span>
                            <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender">
                                <option value="all">{t("managerStudents.allPrograms", "Tous les programmes")}</option>
                                {programs.map((program) => <option key={program}
                                                                   value={program}>{t(`employerOffers.disciplines.${String(program).toUpperCase()}`, {defaultValue: program})}</option>)}
                            </select>
                        </label>
                        <label>
                            <span
                                className="sr-only">{t("managerStudents.filterAssignment", "Filtrer par assignation")}</span>
                            <select value={assignmentFilter}
                                    onChange={(event) => setAssignmentFilter(event.target.value)}
                                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender">
                                <option
                                    value="all">{t("managerStudents.allAssignments", "Toutes les assignations")}</option>
                                <option
                                    value="assigned">{t("managerStudents.assigned", "Avec professeur assigné")}</option>
                                <option
                                    value="unassigned">{t("managerStudents.unassigned", "Sans professeur assigné")}</option>
                            </select>
                        </label>
                    </div>

                    {loadingSessions || loadingStudents ?
                        <p className="py-12 text-center text-sm font-medium text-ink-soft">{t("managerStudents.loading", "Chargement des étudiants…")}</p> : !error && filteredStudents.length === 0 ? (
                            <div
                                className="mt-6 rounded-2xl border border-dashed border-line bg-canvas px-6 py-12 text-center">
                                <p className="font-bold text-ink">{students.length === 0 ? t("managerStudents.emptySession", {
                                    session: selectedLabel,
                                    defaultValue: "Aucun étudiant enregistré pour la session {{session}}."
                                }) : t("managerStudents.emptyFiltered", "Aucun étudiant ne correspond aux filtres sélectionnés.")}</p>
                                <p className="mt-2 text-sm text-ink-soft">{t("managerStudents.emptyHint", "Essayez une autre session ou modifiez vos filtres.")}</p>
                        </div>
                        ) : !error && <>
                            <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                                <table className="w-full min-w-[900px] border-collapse text-left">
                                    <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-soft">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">{t("managerStudents.student", "Étudiant")}</th>
                                        <th className="px-4 py-3 font-bold">{t("managerStudents.program", "Programme / discipline")}</th>
                                        <th className="px-4 py-3 font-bold">{t("managerStudents.statusColumn", "Statut de stage")}</th>
                                        <th className="px-4 py-3 font-bold">{t("managerStudents.professor", "Professeur assigné")}</th>
                                        <th className="px-4 py-3 font-bold">{t("managerStudents.company", "Entreprise d’accueil")}</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line bg-surface">
                                    {filteredStudents.map((student) => {
                                        const status = statusOf(student);
                                        const professorValue = valueOf(student, "professeurNom", "professorName", "professeur", "professor");
                                        const professor = typeof professorValue === "object" ? fullName(professorValue) : professorValue ?? [student.professeurPrenom, student.professeurNom].filter(Boolean).join(" ");
                                        const company = valueOf(student, "entreprise", "nomEntreprise", "companyName", "employeurNom");
                                        const program = valueOf(student, "discipline", "programme", "program", "programName");
                                        return <tr key={student.id ?? student.email}>
                                            <td className="px-4 py-4"><p
                                                className="font-bold text-ink">{fullName(student) || t("managerStudents.unnamed", "Étudiant")}</p>
                                                <p className="mt-1 text-xs text-ink-soft">{valueOf(student, "email", "courriel") ?? "—"}</p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-ink-soft">{program ? t(`employerOffers.disciplines.${String(program).toUpperCase()}`, {defaultValue: program}) : "—"}</td>
                                            <td className="px-4 py-4"><span
                                                className="inline-flex rounded-full bg-lavender/50 px-2.5 py-1 text-xs font-bold text-ink">{status ? t(`managerStudents.statuses.${status}`, {defaultValue: status.replaceAll("_", " ").toLocaleLowerCase()}) : "—"}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-ink-soft">{professor || t("managerStudents.unassigned", "Sans professeur assigné")}</td>
                                            <td className="px-4 py-4 text-sm text-ink-soft">{company || "—"}</td>
                                        </tr>;
                                    })}
                                    </tbody>
                                </table>
                        </div>
                            <p className="mt-3 text-xs text-ink-soft">{t("managerStudents.resultCount", {
                                count: filteredStudents.length,
                                total: students.length,
                                defaultValue: "{{count}} étudiant(s) affiché(s) sur {{total}}"
                            })}</p>
                        </>}
                </section>
            </div>
        </section>
    );
}
