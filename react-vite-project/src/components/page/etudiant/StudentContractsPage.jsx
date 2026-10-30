import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {notifyStudentTabCountsChanged} from "../../../utils/tabCounts.js";
import ContractSignaturePage from "../ContractSignaturePage.jsx";

const SIGNED_STATUSES = new Set([
    "SIGNED_BY_STUDENT",
    "SIGNED_BY_EMPLOYER",
    "SIGNED_BY_GESTIONNAIRE",
    "EXECUTED",
]);

function statusOf(contract) {
    return String(contract?.contractStatus ?? contract?.status ?? "").toUpperCase();
}

function isSigned(contract) {
    return SIGNED_STATUSES.has(statusOf(contract));
}

function contractId(contract) {
    return String(contract?.contractId ?? contract?.id ?? "");
}

function splitName(value) {
    const [firstName = "", ...lastName] = String(value ?? "").trim().split(/\s+/);
    return {prenom: firstName, nom: lastName.join(" ")};
}

function toSignatureContract(contract, user) {
    const employer = splitName(contract.employerFullName);
    const manager = splitName(contract.managerFullName);

    return {
        ...contract,
        contractId: contractId(contract),
        student: {
            prenom: user?.prenom ?? user?.firstName ?? "",
            nom: user?.nom ?? user?.lastName ?? "",
        },
        employee: {
            ...employer,
            nomCompagnie: contract.companyName ?? "",
        },
        admin: manager,
        internshipOffer: {
            nomEntreprise: contract.companyName ?? "",
            position: contract.offerTitle ?? "",
            descriptionPosition: contract.offerDescription ?? "",
        },
        startingDate: contract.internshipStartingDate,
        endingDate: contract.internshipEndingDate,
        internshipLocation: contract.internshipLocation,
        hourlySalary: contract.hourlySalary,
        weeklyHours: contract.weeklyHours,
    };
}

export default function StudentContractsPage({user}) {
    const {i18n, t} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        let active = true;

        setLoading(true);
        api.student.getContracts()
            .then(async (response) => {
                if (!response.ok) throw new Error("contract_load_failed");
                const payload = response.status === 204 ? [] : await response.json();
                const list = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? [];
                if (active) setContracts(list);
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user]);

    useEffect(() => {
        if (!selectedId) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setSelectedId(null);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [selectedId]);

    const hasSignedOne = useMemo(() => contracts.some(isSigned), [contracts]);
    const selectedContract = contracts.find((contract) => contractId(contract) === selectedId);

    const signContract = async (contract) => {
        const id = contractId(contract);
        const response = await api.student.signContract(id);
        if (response.status === 409) {
            const latestContractsResponse = await api.student.getContracts();
            if (latestContractsResponse.ok) {
                const latestContracts = await latestContractsResponse.json();
                setContracts(Array.isArray(latestContracts) ? latestContracts : []);
                notifyStudentTabCountsChanged();
            }
            throw new Error("another_contract_signed");
        }
        if (!response.ok) throw new Error("contract_sign_failed");
        const updated = await response.json();
        setContracts((current) => current.map((item) => contractId(item) === id ? updated : item));
        notifyStudentTabCountsChanged();
        return updated;
    };

    const formatDate = (value) => {
        if (!value) return t("studentContracts.notSpecified");
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
        return Number.isNaN(date.getTime())
            ? String(value)
            : new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
                day: "numeric", month: "short", year: "numeric",
            }).format(date);
    };

    return (
        <section className="mt-7">
            <section
                className="mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6">
                <div className="rounded-2xl border border-line bg-canvas p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("studentContracts.listEyebrow")}</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-ink">{t("studentContracts.listTitle")}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{t("studentContracts.listDescription")}</p>
                </div>

                {loading ? (
                    <p className="mt-5 py-10 text-center text-sm text-ink-soft">{t("studentContracts.loading")}</p>
                ) : error ? (
                    <p className="mt-5 rounded-xl border border-error bg-blush/30 p-4 text-sm font-semibold text-error"
                       role="alert">{t("studentContracts.loadError")}</p>
                ) : contracts.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-line bg-canvas p-7 text-center"
                         role="status">
                        <h3 className="text-base font-black text-ink">{t("studentContracts.emptyTitle")}</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t("studentContracts.emptyDescription")}</p>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {contracts.map((contract) => {
                            const id = contractId(contract);
                            const status = statusOf(contract);
                            const signed = isSigned(contract);
                            const pending = status === "PENDING_SIGNATURE";
                            const locked = pending && hasSignedOne;
                            const open = selectedId === id;
                            const badgeText = signed ? t("studentContracts.statusSigned") : locked ? t("studentContracts.statusLocked") : pending ? t("studentContracts.statusWaiting") : t("studentContracts.statusOther");
                            const badgeStyle = signed ? "border-green-200 bg-green-50 text-green-800" : locked ? "border-peach bg-peach/40 text-ink" : "border-gold/60 bg-gold/20 text-ink";

                            return (
                                <article key={id}
                                         className={`rounded-2xl border p-4 transition-colors ${open ? "border-ink bg-lavender/25" : "border-line bg-canvas"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">{t("studentContracts.number")} {id}</p>
                                            <p className="mt-1 truncate text-base font-black text-ink">{contract.offerTitle || t("studentContracts.notSpecified")}</p>
                                            <p className="mt-1 truncate text-sm font-semibold text-ink-soft">{contract.companyName || t("studentContracts.notSpecified")}</p>
                                        </div>
                                        <span
                                            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${badgeStyle}`}>{badgeText}</span>
                                    </div>
                                    <dl className="mt-4 grid gap-3 border-y border-line py-3 text-sm sm:grid-cols-2">
                                        <div>
                                            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{t("studentContracts.company")}</dt>
                                            <dd className="mt-1 truncate font-bold text-ink">{contract.companyName || t("studentContracts.notSpecified")}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{t("studentContracts.start")}</dt>
                                            <dd className="mt-1 font-bold text-ink">{formatDate(contract.internshipStartingDate)}</dd>
                                        </div>
                                    </dl>
                                    {locked &&
                                        <p className="mt-3 text-xs leading-5 text-ink-soft">{t("studentContracts.statusLocked")}</p>}
                                    <button type="button" onClick={() => setSelectedId(open ? null : id)}
                                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/40">
                                        {open ? t("studentContracts.close") : pending && !hasSignedOne ? t("studentContracts.viewSign") : t("studentContracts.view")}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {selectedContract && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-6"
                    role="presentation"
                    onMouseDown={(event) => event.target === event.currentTarget && setSelectedId(null)}>
                    <section
                        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-line bg-canvas shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)]"
                        role="dialog" aria-modal="true" aria-labelledby="student-selected-contract-title">
                        <header
                            className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-7">
                            <h2 id="student-selected-contract-title"
                                className="text-base font-black text-ink sm:text-lg">
                                {t("studentContracts.selected")} · {t("studentContracts.number")} {contractId(selectedContract)}
                            </h2>
                            <button type="button" onClick={() => setSelectedId(null)}
                                    aria-label={t("studentContracts.close")}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink">
                                ×
                            </button>
                        </header>
                        <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
                            <ContractSignaturePage
                                key={contractId(selectedContract)}
                                user={user}
                                contract={toSignatureContract(selectedContract, user)}
                                signer="student"
                                readOnly={statusOf(selectedContract) !== "PENDING_SIGNATURE" || hasSignedOne}
                                readOnlyMessage={hasSignedOne ? undefined : t("studentContracts.unavailableDescription")}
                                onSigned={signContract}
                            />
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
