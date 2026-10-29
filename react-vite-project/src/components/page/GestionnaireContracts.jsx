import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../../utils/api.js";
import ValidationTabs from "./ValidationTabs.jsx";

export default function GestionnaireContracts({embedded = false}) {
    const { t, i18n } = useTranslation();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedContract, setSelectedContract] = useState(null);
    const STATUS_DEFAULTS = { PENDING_SIGNATURE: "En attente de signature" };
    const statusLabel = (status) =>
        status ? t(`managerContracts.status.${status}`, STATUS_DEFAULTS[status] ?? status) : "—";

    const normalizeContract = (c) => ({
        ...c,
        studentName: c.studentFullName ?? c.studentName ?? c.nomEtudiant ?? "",
        discipline: c.fieldOfStudy ?? c.discipline ?? "",
        employerName: c.employerFullName ?? c.employerName ?? "",
        startDate: c.internshipStartingDate ?? c.startDate,
        endDate: c.internshipEndingDate ?? c.endDate,
        location: c.internshipLocation ?? c.location,
        remuneration: c.hourlySalary ?? c.remuneration,
        status: c.contractStatus ?? c.status,
    });

    const loadContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.gestionnaire.getContracts();
            if (!res.ok) throw new Error("load_failed");
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            setContracts(list.map(normalizeContract));
        } catch {
            setError({ key: "managerContracts.errors.loadFailed" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, []);

    const filteredContracts = useMemo(() => {
        return contracts.filter((c) => {
            const student = `${c.studentName || c.nomEtudiant || ""} ${c.student?.firstName || ""} ${c.student?.lastName || ""}`.toLowerCase();
            const company = (c.companyName || c.nomEntreprise || "").toLowerCase();
            return student.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
        });
    }, [contracts, searchTerm]);

    const formatDate = (val) => {
        if (!val) return "—";
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return val;
        return new Intl.DateTimeFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {
            day: "numeric", month: "short", year: "numeric",
        }).format(d);
    };

    return (
        <section className={embedded ? "mt-8 w-full" : "flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"}>
            <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl"}>
                {!embedded && <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("managerDashboard.eyebrow", "Espace gestionnaire")}
                    </span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                        {t("managerContracts.title", "Contrats de stage créés")}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                        {t("managerContracts.description", "Consultez l'ensemble des ententes de stage enregistrées et prêtes pour signature.")}
                    </p>
                </header>}

                {!embedded && <ValidationTabs activeTab="contracts"/>}

                {error && (
                    <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700" role="alert">
                        {t(error.key, "Erreur de chargement des contrats.")}
                    </p>
                )}

                <div className="mt-8">
                    <input
                        type="text"
                        placeholder={t("managerContracts.searchPlaceholder", "Rechercher par étudiant ou entreprise...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:max-w-md rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-lavender"
                    />
                </div>

                <div className="mt-6">
                    {loading ? (
                        <div className="py-12 text-center text-ink-soft font-medium">
                            {t("managerValidation.loading", "Chargement…")}
                        </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="rounded-2xl border border-line bg-surface p-12 text-center text-ink-soft">
                            {t("managerContracts.empty", "Aucun contrat enregistré.")}
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 sm:hidden">
                                {filteredContracts.map((contract) => (
                                    <div
                                        key={contract.id || contract.contractId}
                                        onClick={() => setSelectedContract(contract)}
                                        className="rounded-2xl border border-line bg-surface p-4 shadow-sm cursor-pointer hover:border-ink"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-black text-ink">{contract.studentName || contract.nomEtudiant || "Étudiant"}</h3>
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                               {statusLabel(contract.status)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs font-semibold text-ink-soft">{contract.companyName || contract.nomEntreprise || "Entreprise"}</p>
                                        <p className="mt-3 text-xs text-ink-soft">
                                            {formatDate(contract.startDate || contract.dateDebut)} → {formatDate(contract.endDate || contract.dateFin)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden sm:block overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="border-b border-line bg-canvas text-xs font-bold uppercase tracking-wider text-ink-soft">
                                        <th className="p-4">{t("managerContracts.table.student", "Étudiant")}</th>
                                        <th className="p-4">{t("managerContracts.table.company", "Entreprise")}</th>
                                        <th className="p-4">{t("managerContracts.table.period", "Période")}</th>
                                        <th className="p-4">{t("managerContracts.table.status", "Statut")}</th>
                                        <th className="p-4 text-right">{t("managerContracts.table.actions", "Actions")}</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line text-sm">
                                    {filteredContracts.map((contract) => (
                                        <tr
                                            key={contract.id || contract.contractId}
                                            onClick={() => setSelectedContract(contract)}
                                            className="hover:bg-canvas/50 cursor-pointer transition-colors"
                                        >
                                            <td className="p-4 font-bold text-ink">{contract.studentName || contract.nomEtudiant || "—"}</td>
                                            <td className="p-4 text-ink-soft font-semibold">{contract.companyName || contract.nomEntreprise || "—"}</td>
                                            <td className="p-4 text-ink-soft text-xs">
                                                {formatDate(contract.startDate || contract.dateDebut)} → {formatDate(contract.endDate || contract.dateFin)}
                                            </td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                                    {contract.status || "CRÉÉ"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedContract(contract);
                                                    }}
                                                    className="text-xs font-bold text-ink hover:underline"
                                                >
                                                    {t("managerContracts.viewDetails", "Voir détail")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {selectedContract && (
                    <div
                        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-ink/70 p-0 sm:p-4 backdrop-blur-sm"
                        role="presentation"
                        onClick={() => setSelectedContract(null)}
                    >
                        <div
                            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] border border-line bg-surface shadow-2xl p-6 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-line pb-4">
                                <h2 className="text-xl font-black text-ink">
                                    {t("managerContracts.detailTitle", "Détail du contrat de stage")}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSelectedContract(null)}
                                    aria-label={t("common.close", "Fermer")}
                                    className="rounded-xl border border-line p-2 text-ink-soft hover:bg-canvas hover:text-ink"
                                >
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 6l12 12M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-6 space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-canvas p-4">
                                    <div>
                                        <span className="block text-xs font-bold uppercase text-ink-soft">{t("managerContracts.student", "Étudiant")}</span>
                                        <p className="mt-1 font-bold text-ink">{selectedContract.studentName || selectedContract.nomEtudiant || "—"}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold uppercase text-ink-soft">{t("managerContracts.discipline", "Discipline")}</span>
                                        <p className="mt-1 font-bold text-ink">{selectedContract.discipline || "—"}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold uppercase text-ink-soft">{t("managerContracts.company", "Entreprise")}</span>
                                        <p className="mt-1 font-bold text-ink">{selectedContract.companyName || selectedContract.nomEntreprise || "—"}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold uppercase text-ink-soft">{t("managerContracts.employer", "Employeur")}</span>
                                        <p className="mt-1 font-bold text-ink">{selectedContract.employerName || selectedContract.nomEmployeur || "—"}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-line p-4 space-y-3">
                                    <h3 className="font-black text-ink text-xs uppercase tracking-wider text-ink-soft">{t("managerContracts.modalities", "Modalités")}</h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-ink-soft">Début :</span> <strong className="text-ink">{formatDate(selectedContract.startDate || selectedContract.dateDebut)}</strong></div>
                                        <div><span className="text-ink-soft">Fin :</span> <strong className="text-ink">{formatDate(selectedContract.endDate || selectedContract.dateFin)}</strong></div>
                                        <div><span className="text-ink-soft">Horaire :</span> <strong className="text-ink">{selectedContract.schedule || selectedContract.horaire || "—"}</strong></div>
                                        <div><span className="text-ink-soft">Heures/semaine :</span> <strong className="text-ink">{selectedContract.weeklyHours || selectedContract.heuresParSemaine || "—"}</strong></div>
                                        <div><span className="text-ink-soft">Lieu :</span> <strong className="text-ink">{selectedContract.location || selectedContract.lieu || "—"}</strong></div>
                                        <div><span className="text-ink-soft">Rémunération :</span> <strong className="text-ink">{selectedContract.remuneration ?? selectedContract.salaire ?? 0} $/h</strong></div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-line">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedContract(null)}
                                        className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft"
                                    >
                                        {t("common.close", "Fermer")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
