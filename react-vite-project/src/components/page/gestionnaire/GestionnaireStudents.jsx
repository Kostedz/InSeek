import {useEffect, useState, useMemo} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import GestionnaireTabs from "./GestionnaireTabs.jsx";
import ContractCreationModal from "../../gestionnaire/ContractCreationModal.jsx";

export default function GestionnaireStudents({embedded = false}) {
    const {t} = useTranslation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedStudentForContract, setSelectedStudentForContract] = useState(null);

    const loadStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.gestionnaire.getEligibleStudents();
            if (!res.ok) throw new Error("load_failed");
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            setStudents(list);
        } catch {
            setError({key: "managerStudents.errors.loadFailed"});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const name = `${s.firstName || s.prenom || ""} ${s.lastName || s.nom || ""}`.toLowerCase();
            const email = (s.email || "").toLowerCase();
            const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

            const hasContract = Boolean(s.hasContract || s.contractExists);
            if (filterStatus === "without" && hasContract) return false;
            if (filterStatus === "with" && !hasContract) return false;

            return matchesSearch;
        });
    }, [students, searchTerm, filterStatus]);

    return (
        <section className={embedded ? "mt-8 w-full" : "flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"}>
            <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl"}>
                {!embedded && <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("managerDashboard.eyebrow", "Espace gestionnaire")}
                    </span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                        {t("managerStudents.title", "Étudiants ayant trouvé un stage")}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                        {t("managerStudents.description", "Consultez les étudiants éligibles et créez leurs contrats de stage.")}
                    </p>
                </header>}

                {!embedded && <GestionnaireTabs activeTab="students"/>}

                {error && (
                    <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
                       role="alert">
                        {t(error.key, "Erreur de chargement des étudiants.")}
                    </p>
                )}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="text"
                        placeholder={t("managerStudents.searchPlaceholder", "Rechercher par nom ou courriel...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:max-w-md rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterStatus("all")}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
                                filterStatus === "all" ? "bg-ink text-white border-ink" : "bg-surface text-ink border-line hover:bg-canvas"
                            }`}
                        >
                            {t("managerStudents.filters.all", "Tous")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("without")}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
                                filterStatus === "without" ? "bg-ink text-white border-ink" : "bg-surface text-ink border-line hover:bg-canvas"
                            }`}
                        >
                            {t("managerStudents.filters.withoutContract", "Sans contrat")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus("with")}
                            className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
                                filterStatus === "with" ? "bg-ink text-white border-ink" : "bg-surface text-ink border-line hover:bg-canvas"
                            }`}
                        >
                            {t("managerStudents.filters.withContract", "Avec contrat")}
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {loading ? (
                        <div className="py-12 text-center text-ink-soft font-medium">
                            {t("managerValidation.loading", "Chargement…")}
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="rounded-2xl border border-line bg-surface p-12 text-center text-ink-soft">
                            {t("managerStudents.empty", "Aucun étudiant trouvé.")}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredStudents.map((student) => {
                                const hasContract = Boolean(student.hasContract || student.contractExists);
                                const studentName = `${student.firstName || student.prenom || ""} ${student.lastName || student.nom || ""}`.trim();

                                return (
                                    <div key={student.id}
                                         className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-sm">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-black text-ink text-base">{studentName || "Étudiant"}</h3>
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                                        hasContract ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                    }`}>
                                                    {hasContract ? t("managerStudents.status.hasContract", "Contrat créé") : t("managerStudents.status.noContract", "Stage trouvé")}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-ink-soft break-all">{student.email}</p>
                                            {student.discipline && (
                                                <p className="mt-3 text-xs font-semibold text-ink">
                                                    <span
                                                        className="text-ink-soft">{t("managerStudents.discipline", "Discipline")} : </span>
                                                    {student.discipline}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-line">
                                            {hasContract ? (
                                                <span
                                                    className="block text-center text-xs font-bold text-ink-soft italic">
                                                    {t("managerStudents.contractAlreadyCreated", "Contrat déjà actif")}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedStudentForContract(student)}
                                                    className="w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white hover:bg-ink-soft transition-colors"
                                                >
                                                    {t("managerStudents.createContractButton", "Créer le contrat")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedStudentForContract && (
                    <ContractCreationModal
                        student={selectedStudentForContract}
                        onClose={() => setSelectedStudentForContract(null)}
                        onSuccess={() => {
                            setSelectedStudentForContract(null);
                            loadStudents();
                        }}
                    />
                )}
            </div>
        </section>
    );
}
