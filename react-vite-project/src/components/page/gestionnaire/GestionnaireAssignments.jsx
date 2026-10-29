import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {notifyPendingDocumentProcessed} from "../../../utils/gestionnaireCounts.js";

const asList = (value) => Array.isArray(value) ? value : value?.items ?? value?.content ?? [];
const fullName = (person) => [person?.prenom ?? person?.firstName, person?.nom ?? person?.lastName].filter(Boolean).join(" ");

export default function GestionnaireAssignments() {
    const {t} = useTranslation();
    const [students, setStudents] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [choices, setChoices] = useState({});
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [pendingAssignment, setPendingAssignment] = useState(null);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const [studentResponse, professorResponse] = await Promise.all([
                api.gestionnaire.getInternshipStudents(),
                api.gestionnaire.getProfessors(),
            ]);
            if (!studentResponse.ok || !professorResponse.ok) throw new Error("load_failed");
            const studentList = asList(await studentResponse.json());
            const professorList = asList(await professorResponse.json());
            setStudents(studentList);
            setProfessors(professorList);
            setChoices(Object.fromEntries(studentList.map((student) => [student.id, student.professeurId ? String(student.professeurId) : ""])));
        } catch {
            setError(t("professorAssignment.errors.load", "Impossible de charger les étudiants et les professeurs."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const visibleStudents = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return students;
        return students.filter((student) => `${fullName(student)} ${student.email ?? ""}`.toLocaleLowerCase().includes(query));
    }, [students, search]);

    const assign = (student) => {
        const professorId = choices[student.id];
        if (!professorId) {
            setNotice("");
            setError(t("professorAssignment.errors.required", "Veuillez sélectionner un professeur avant de continuer."));
            return;
        }
        const professor = professors.find((item) => String(item.id) === String(professorId));
        setError("");
        setNotice("");
        setPendingAssignment({student, professor, professorId});
    };

    const confirmAssignment = async () => {
        if (!pendingAssignment) return;
        const {student, professor, professorId} = pendingAssignment;
        const studentName = fullName(student) || student.email;
        setPendingAssignment(null);
        setSavingId(student.id);
        try {
            const response = await api.gestionnaire.assignProfessor(student.id, Number(professorId));
            if (!response.ok) throw new Error("assignment_failed");
            const updatedStudent = await response.json();
            setStudents((current) => current.map((item) => item.id === student.id ? updatedStudent : item));
            setChoices((current) => ({...current, [student.id]: String(updatedStudent.professeurId ?? professorId)}));
            if (!student.professeurId) notifyPendingDocumentProcessed("STUDENT_ASSIGNMENT");
            setNotice(t("professorAssignment.success", {
                student: fullName(updatedStudent) || studentName,
                professor: fullName(professor),
                defaultValue: "Le professeur {{professor}} supervise maintenant {{student}}.",
            }));
        } catch {
            setError(t("professorAssignment.errors.save", "L’assignation n’a pas pu être enregistrée. Réessayez."));
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="mt-8" aria-labelledby="assignment-title">
            <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 id="assignment-title"
                            className="text-xl font-black text-ink">{t("professorAssignment.title", "Assignation des professeurs")}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{t("professorAssignment.description", "Consultez tous les étudiants et leur superviseur actuel. Vous pouvez assigner ou réassigner un professeur.")}</p>
                    </div>
                    <label className="w-full sm:max-w-xs">
                        <span className="sr-only">{t("professorAssignment.search", "Rechercher un étudiant")}</span>
                        <input value={search} onChange={(event) => setSearch(event.target.value)}
                               placeholder={t("professorAssignment.search", "Rechercher un étudiant")}
                               className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none focus:border-lavender"/>
                    </label>
                </div>

                {error &&
                    <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
                       role="alert">{error}</p>}
                {notice &&
                    <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
                       role="status">{notice}</p>}

                {loading ?
                    <p className="py-12 text-center text-sm font-medium text-ink-soft">{t("professorAssignment.loading", "Chargement des listes…")}</p> : (
                        <>
                            {professors.length === 0 &&
                                <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
                                   role="status">{t("professorAssignment.noProfessors", "Aucun professeur n’est inscrit sur la plateforme pour le moment.")}</p>}
                            <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                                <table className="w-full min-w-[760px] border-collapse text-left">
                                    <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-soft">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">{t("professorAssignment.student", "Étudiant")}</th>
                                        <th className="px-4 py-3 font-bold">{t("professorAssignment.discipline", "Discipline")}</th>
                                        <th className="px-4 py-3 font-bold">{t("professorAssignment.currentProfessor", "Professeur assigné")}</th>
                                        <th className="px-4 py-3 font-bold">{t("professorAssignment.chooseProfessor", "Choisir un professeur")}</th>
                                        <th className="px-4 py-3 font-bold">{t("professorAssignment.action", "Action")}</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line bg-surface">
                                    {visibleStudents.map((student) => {
                                        const currentProfessor = [student.professeurPrenom, student.professeurNom].filter(Boolean).join(" ");
                                        const selectedId = choices[student.id] ?? "";
                                        const isSame = selectedId && String(student.professeurId ?? "") === String(selectedId);
                                        return <tr key={student.id}>
                                            <td className="px-4 py-4"><p
                                                className="font-bold text-ink">{fullName(student) || t("professorAssignment.unnamed", "Étudiant")}</p>
                                                <p className="mt-1 text-xs text-ink-soft">{student.email}</p></td>
                                            <td className="px-4 py-4 text-sm text-ink-soft">{student.discipline ? t(`employerOffers.disciplines.${String(student.discipline).toUpperCase()}`, {defaultValue: student.discipline}) : "—"}</td>
                                            <td className="px-4 py-4 text-sm font-semibold text-ink">{currentProfessor ||
                                                <span
                                                    className="font-medium text-ink-soft">{t("professorAssignment.unassigned", "Non assigné")}</span>}</td>
                                            <td className="px-4 py-4">
                                                <select aria-label={t("professorAssignment.selectAria", {
                                                    student: fullName(student),
                                                    defaultValue: "Professeur pour {{student}}"
                                                })}
                                                        value={selectedId}
                                                        disabled={professors.length === 0 || savingId !== null}
                                                        onChange={(event) => {
                                                            setChoices((current) => ({
                                                                ...current,
                                                                [student.id]: event.target.value
                                                            }));
                                                            setError("");
                                                            setNotice("");
                                                        }}
                                                        className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-lavender disabled:opacity-60">
                                                    <option
                                                        value="">{t("professorAssignment.selectPlaceholder", "Sélectionner un professeur")}</option>
                                                    {professors.map((professor) => <option key={professor.id}
                                                                                           value={professor.id}>{fullName(professor)}{professor.email ? ` · ${professor.email}` : ""}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <button type="button" onClick={() => assign(student)}
                                                        disabled={professors.length === 0 || savingId !== null || isSame}
                                                        className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-45">
                                                    {savingId === student.id ? t("professorAssignment.saving", "Enregistrement…") : student.professeurId ? t("professorAssignment.reassign", "Réassigner") : t("professorAssignment.assign", "Assigner")}
                                                </button>
                                            </td>
                                        </tr>;
                                    })}
                                    {visibleStudents.length === 0 && <tr>
                                        <td colSpan="5"
                                            className="px-4 py-12 text-center text-sm text-ink-soft">{students.length ? t("professorAssignment.noSearchResults", "Aucun étudiant ne correspond à la recherche.") : t("professorAssignment.noStudents", "Aucun étudiant inscrit.")}</td>
                                    </tr>}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-xs text-ink-soft">{t("professorAssignment.studentCount", {
                                count: students.length,
                                defaultValue: "{{count}} étudiant(s)"
                            })}</p>
                        </>
                    )}
            </div>
            {pendingAssignment &&
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-4 py-8"
                     onMouseDown={(event) => {
                         if (event.target === event.currentTarget) setPendingAssignment(null);
                     }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="assignment-confirm-title"
                             aria-describedby="assignment-confirm-description"
                             className="w-full max-w-lg rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(48,35,55,0.28)] sm:p-8">
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("professorAssignment.confirmEyebrow", "Confirmation")}</span>
                        <h2 id="assignment-confirm-title"
                            className="mt-4 text-2xl font-black text-ink">{t("professorAssignment.confirmTitle", "Confirmer l’assignation")}</h2>
                        <p id="assignment-confirm-description" className="mt-3 text-sm leading-7 text-ink-soft">
                            {t("professorAssignment.confirm", {
                                student: fullName(pendingAssignment.student) || pendingAssignment.student.email,
                                professor: fullName(pendingAssignment.professor) || pendingAssignment.professor?.email || "",
                                defaultValue: "Confirmer l’assignation de {{student}} à {{professor}} ?",
                            })}
                        </p>
                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setPendingAssignment(null)}
                                    className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold text-ink transition hover:bg-canvas">
                                {t("professorAssignment.cancel", "Annuler")}
                            </button>
                            <button type="button" onClick={confirmAssignment}
                                    className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-soft">
                                {t("professorAssignment.confirmAction", "Confirmer")}
                            </button>
                        </div>
                    </section>
                </div>}
        </section>
    );
}
