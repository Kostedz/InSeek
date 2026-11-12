import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";

const listOf = (data) => Array.isArray(data) ? data : data?.items ?? data?.content ?? data?.contracts ?? [];
const contractStatus = (contract) => String(contract?.contractStatus ?? contract?.status ?? "").trim().toUpperCase();
const isEligible = (contract) => ["EXECUTED", "FULLY_SIGNED", "COMPLETED"].includes(contractStatus(contract));
const studentName = (contract) => contract?.studentFullName
    || [contract?.student?.prenom ?? contract?.student?.firstName, contract?.student?.nom ?? contract?.student?.lastName].filter(Boolean).join(" ")
    || contract?.studentName || "";
const contractTitle = (contract) => contract?.offerTitle ?? contract?.position ?? contract?.internshipOffer?.position ?? "";
const draftStorageKey = "inseek.employer.internship-evaluation.drafts";
export const EMPLOYER_EVALUATIONS_UPDATED_EVENT = "inseek:employer-evaluations-updated";
const readStorage = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        return {};
    }
};
const initialDraft = () => ({skills: "3", integration: "3", objectives: "3", overall: "3", comments: ""});

export default function EmployerEvaluationsPage() {
    const {t} = useTranslation();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [drafts, setDrafts] = useState(() => readStorage(draftStorageKey));
    const [submitted, setSubmitted] = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        let active = true;
        api.employer.getContracts().then(async (response) => {
            if (!response.ok) throw new Error("load_failed");
            const values = listOf(await response.json());
            if (active) setContracts(values);
        }).catch(() => {
            if (active) setError(t("employerEvaluation.errors.load", "Impossible de charger les stagiaires embauchés."));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [t]);

    useEffect(() => localStorage.setItem(draftStorageKey, JSON.stringify(drafts)), [drafts]);
    useEffect(() => localStorage.removeItem("inseek.employer.internship-evaluation.submitted"), []);
    useEffect(() => {
        if (!selectedId && !confirming) return undefined;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                if (confirming) setConfirming(false);
                else setSelectedId(null);
            }
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [selectedId, confirming]);

    const eligibleContracts = useMemo(() => contracts.filter((contract) => isEligible(contract) || submitted[contract.id]), [contracts, submitted]);
    const submittedCount = eligibleContracts.filter((contract) => submitted[String(contract.id)]).length;
    const pendingCount = eligibleContracts.length - submittedCount;
    const selected = eligibleContracts.find((contract) => String(contract.id) === String(selectedId));
    const selectedKey = selected ? String(selected.id) : "";
    const storedValues = selected ? (submitted[selectedKey] ?? drafts[selectedKey] ?? initialDraft()) : initialDraft();
    const values = {
        ...storedValues,
        skills: storedValues.skills || "3",
        integration: storedValues.integration || "3",
        objectives: storedValues.objectives || "3",
        overall: storedValues.overall || "3",
    };
    const updateField = (field, value) => {
        setDrafts((current) => ({
            ...current,
            [selectedKey]: {...(current[selectedKey] ?? initialDraft()), [field]: value}
        }));
    };
    const openForm = (contract) => {
        setSelectedId(String(contract.id));
        setConfirming(false);
        if (!submitted[contract.id] && !drafts[contract.id]) {
            setDrafts((current) => ({...current, [contract.id]: initialDraft()}));
        }
    };
    const requestSubmit = () => {
        setConfirming(true);
    };
    const confirmSubmit = () => {
        const record = {...values, submittedAt: new Date().toISOString()};
        const nextSubmitted = {...submitted, [selectedKey]: record};
        setSubmitted(nextSubmitted);
        setDrafts((current) => {
            const next = {...current};
            delete next[selectedKey];
            return next;
        });
        window.dispatchEvent(new CustomEvent(EMPLOYER_EVALUATIONS_UPDATED_EVENT, {
            detail: {pendingCount: Math.max(0, pendingCount - 1)},
        }));
        setConfirming(false);
        setSelectedId(null);
    };

    const slider = (field, label) => <label key={field} className="block py-3 text-sm font-bold text-ink">
        <span className="flex items-center justify-between gap-3"><span>{label}</span><span
            className="rounded-full bg-lavender/40 px-3 py-1 text-xs font-black">{values[field] ? `${values[field]} / 5` : t("employerEvaluation.chooseRating", "Choisir une note")}</span></span>
        <span
            className="professor-rating-slider relative mt-0.5 block h-6 w-full cursor-pointer has-[:focus-visible]:rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink disabled:cursor-default">
            <span className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-lavender/60">
                <span
                    className="absolute left-0 top-0 h-1 rounded-full bg-ink transition-[width] duration-150 ease-out motion-reduce:transition-none"
                    style={{width: `${((Number(values[field] || 3) - 1) / 4) * 100}%`}}/>
                <span
                    className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow-[0_1px_5px_rgba(48,35,55,0.3)] transition-[left,transform] duration-150 ease-out motion-reduce:transition-none"
                    style={{left: `${((Number(values[field] || 3) - 1) / 4) * 100}%`}}/>
            </span>
            <input aria-label={label} type="range" min="1" max="5" step="0.5" value={values[field] || "3"}
                   disabled={Boolean(submitted[selectedKey])}
                   onChange={(event) => updateField(field, event.target.value)}
                   className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"/>
        </span>
        <span
            className="flex justify-between text-[10px] font-bold text-ink-soft"><span>1 · {t("employerEvaluation.ratingLow", "À améliorer")}</span><span>{t("employerEvaluation.ratingHigh", "Excellent")} · 5</span></span>
    </label>;

    return <section className="bg-canvas">
        <div className="mx-auto w-full max-w-7xl">
            <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    [t("employerEvaluation.stats.pending"), pendingCount],
                    [t("employerEvaluation.stats.submitted"), submittedCount],
                ].map(([label, value]) => <div key={label}
                                               className="flex items-center justify-between rounded-xl border border-line bg-white p-3 shadow-[0_6px_18px_rgba(48,35,55,0.04)] xl:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{label}</p>
                    <p className="text-xl font-black text-ink">{value}</p>
                </div>)}
            </div>
            <section
                className="mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6"
                aria-labelledby="employer-evaluation-progress-title">
                <div className="rounded-2xl border border-line bg-canvas p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerEvaluation.eyebrow", "Suivi de stage")}</p>
                    <h2 id="employer-evaluation-progress-title"
                        className="mt-1 text-xl font-black tracking-tight text-ink">{t("employerEvaluation.stats.title", "Progression des évaluations")}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{t("employerEvaluation.stats.description", "Suivez les stagiaires à évaluer et les évaluations envoyées.")}</p>
        </div>
        {loading ?
            <p className="mt-5 py-10 text-center text-sm text-ink-soft">{t("employerEvaluation.loading", "Chargement des stagiaires…")}</p> : error ?
                <p role="alert"
                   className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : eligibleContracts.length === 0 ?
                    <p className="mt-5 rounded-xl bg-canvas p-4 text-sm text-ink-soft">{t("employerEvaluation.empty", "Aucun stagiaire embauché à évaluer pour le moment.")}</p> :
                    <div className="mt-5 grid gap-3">{eligibleContracts.map((contract) => {
                        const id = String(contract.id);
                        const done = submitted[id];
                        return <article key={id}
                                        className="flex flex-col gap-3 rounded-xl border border-line bg-canvas/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div><h3
                                className="font-black text-ink">{studentName(contract) || t("employerEvaluation.student", "Stagiaire")}</h3>
                                <p className="mt-1 text-sm text-ink-soft">{contractTitle(contract) || t("employerEvaluation.positionUnknown", "Poste non précisé")}</p>
                                {done && <span
                                    className="mt-2 inline-flex rounded-full bg-lavender/40 px-3 py-1 text-xs font-black text-ink">{t("employerEvaluation.submitted", "Évaluation envoyée")}</span>}
                            </div>
                            <button type="button" onClick={() => openForm(contract)}
                                    className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft">{done ? t("employerEvaluation.view", "Voir l’évaluation") : t("employerEvaluation.start", "Évaluer le stagiaire")}</button>
                        </article>;
                    })}</div>}
            </section>

        {selected && <div
            className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}>
            <section role="dialog" aria-modal="true" aria-labelledby="employer-evaluation-title"
                     className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-canvas shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]">
                <header
                    className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-surface px-5 py-5 sm:px-7">
                    <div><p
                        className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerEvaluation.eyebrow", "Suivi de stage")}</p>
                        <h2 id="employer-evaluation-title"
                            className="mt-2 text-2xl font-black tracking-tight text-ink">{t("employerEvaluation.formTitle", "Évaluer le stagiaire")}</h2>
                    </div>
                    <button type="button" aria-label={t("employerEvaluation.close", "Fermer l’évaluation")}
                            onClick={() => setSelectedId(null)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft hover:bg-lavender/30">×
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
                    <h3 className="mb-3 text-lg font-black text-ink">{t("employerEvaluation.internshipInfo", "Renseignements sur le stage")}</h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-line bg-surface p-4">
                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerEvaluation.student", "Stagiaire")}</dt>
                            <dd className="mt-1.5 font-black text-ink">{studentName(selected) || "—"}</dd>
                        </div>
                        <div className="rounded-xl border border-line bg-surface p-4">
                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("employerEvaluation.position", "Poste occupé")}</dt>
                            <dd className="mt-1.5 font-black text-ink">{contractTitle(selected) || "—"}</dd>
                        </div>
                    </dl>
                    <section className="mt-6"><p
                        className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{t("employerEvaluation.reviewEyebrow", "Appréciation")}</p>
                        <h3 className="mt-1 text-xl font-black text-ink">{t("employerEvaluation.reviewTitle", "Évaluation du stage")}</h3>
                        <div
                            className="mt-3 rounded-2xl border border-line bg-white px-4 sm:px-5">{slider("skills", t("employerEvaluation.skills", "Compétences et aptitudes"))}
                            <div
                                className="border-t border-line">{slider("integration", t("employerEvaluation.integration", "Comportement et intégration"))}</div>
                            <div
                                className="border-t border-line">{slider("objectives", t("employerEvaluation.objectives", "Atteinte des objectifs du stage"))}</div>
                            <div
                                className="border-t border-line">{slider("overall", t("employerEvaluation.overall", "Note globale"))}</div>
                        </div>
                        <label
                            className="mt-5 block text-sm font-bold text-ink">{t("employerEvaluation.comments", "Commentaires généraux")}<textarea
                            rows="4" disabled={Boolean(submitted[selectedKey])} value={values.comments || ""}
                            onChange={(event) => updateField("comments", event.target.value)}
                            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-white px-3 py-3 font-normal disabled:bg-canvas"/></label>
                    </section>
                    {submitted[selectedKey] &&
                        <p className="mt-4 rounded-xl border border-lavender bg-lavender/20 p-4 text-sm font-bold text-ink">{t("employerEvaluation.success", "Évaluation envoyée avec succès.")}</p>}
                </div>
                {!submitted[selectedKey] && <footer
                    className="flex shrink-0 flex-col gap-3 border-t border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <p className="text-xs font-bold text-ink-soft">{t("employerEvaluation.draftSaved", "Le brouillon est sauvegardé automatiquement sur cet appareil.")}</p>
                    <button type="button" onClick={requestSubmit}
                            className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-ink-soft">{t("employerEvaluation.submit", "Soumettre l’évaluation")}</button>
                </footer>}
            </section>
        </div>}
        {confirming && selected &&
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
                 role="presentation"
                 onMouseDown={(event) => event.target === event.currentTarget && setConfirming(false)}>
                <section role="dialog" aria-modal="true" aria-labelledby="evaluation-confirm-title"
                         className="w-full max-w-md rounded-[1.5rem] border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(48,35,55,0.3)]">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerEvaluation.confirmEyebrow", "Confirmation")}</p>
                    <h2 id="evaluation-confirm-title"
                        className="mt-2 text-xl font-black text-ink">{t("employerEvaluation.confirmTitle", "Envoyer cette évaluation ?")}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{t("employerEvaluation.confirmDescription", "Vérifiez vos réponses avant de confirmer l’envoi.")}</p>
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => setConfirming(false)}
                                className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink">{t("employerEvaluation.cancel", "Continuer à modifier")}</button>
                        <button type="button" onClick={confirmSubmit}
                                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white">{t("employerEvaluation.confirm", "Confirmer l’envoi")}</button>
                    </div>
                </section>
            </div>}
        </div>
    </section>;
}
