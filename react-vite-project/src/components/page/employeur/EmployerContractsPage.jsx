import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import ContractSignaturePage, {
    DEMO_CONTRACTS_UPDATED_EVENT,
    getDemoContracts,
    isDemoEmployer,
    saveDemoContract
} from "../ContractSignaturePage.jsx";

const SIGNED_VALUES = new Set(["TRUE", "SIGNED", "SIGN", "COMPLETE", "COMPLETED"]);

function isSignedValue(value) {
    if (value === true) return true;
    if (!value) return false;
    if (typeof value === "object") {
        if (value.signedAt || value.date) return true;
        return isSignedValue(value.signed ?? value.isSigned ?? value.status);
    }
    return SIGNED_VALUES.has(String(value).trim().toUpperCase());
}

function getContractList(contracts) {
    if (Array.isArray(contracts)) return contracts;
    if (!contracts || typeof contracts !== "object") return [];
    const list = contracts.items ?? contracts.content ?? contracts.contracts ?? [];
    return Array.isArray(list) ? list : [];
}

function contractStatus(contract) {
    return String(contract?.contractStatus ?? contract?.status ?? "").trim().toUpperCase();
}

function hasStudentSigned(contract) {
    const status = contractStatus(contract);
    const explicitSignature = contract?.studentSigned
        ?? contract?.isStudentSigned
        ?? contract?.signedByStudent
        ?? contract?.etudiantSigne
        ?? contract?.studentSignature
        ?? contract?.signatureEtudiant
        ?? contract?.signatures?.student;

    return isSignedValue(explicitSignature)
        || [
            "STUDENT_SIGNED",
            "SIGNED_BY_STUDENT",
            "PENDING_EMPLOYER_SIGNATURE",
            "EMPLOYER_SIGNATURE_REQUIRED",
            "EMPLOYER_SIGNING",
            "EMPLOYER_SIGNED",
            "SIGNED_BY_EMPLOYER",
            "FULLY_SIGNED",
            "COMPLETED",
        ].includes(status);
}

function hasEmployerSigned(contract) {
    const status = contractStatus(contract);
    const explicitSignature = contract?.employerSigned
        ?? contract?.isEmployerSigned
        ?? contract?.signedByEmployer
        ?? contract?.employeurSigne
        ?? contract?.employerSignature
        ?? contract?.signatureEmployeur
        ?? contract?.signatures?.employer;

    return isSignedValue(explicitSignature)
        || ["EMPLOYER_SIGNED", "SIGNED_BY_EMPLOYER", "FULLY_SIGNED", "COMPLETED"].includes(status);
}

function hasStudentDeclined(contract) {
    return ["REFUSED", "REJECTED", "DECLINED"].includes(contractStatus(contract));
}

function contractId(contract, index) {
    return String(contract?.contractId ?? contract?.id ?? contract?.contractNumber ?? index);
}

function studentName(contract) {
    const student = contract?.student ?? contract?.etudiant ?? {};
    const name = [
        student.prenom ?? student.firstName,
        student.nom ?? student.lastName,
    ].filter(Boolean).join(" ");

    return name || student.name || contract?.studentName || contract?.etudiantName || "";
}

function contractPosition(contract) {
    const offer = contract?.internshipOffer ?? contract?.offreDeStage ?? contract?.offer ?? {};
    return offer.position ?? offer.title ?? contract?.position ?? "";
}

function contractStartDate(contract) {
    return contract?.startingDate ?? contract?.startDate ?? contract?.dateDebutStage;
}

function formatDate(value, language) {
    if (!value) return "";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(language === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function ContractIcon({name, className = "h-5 w-5"}) {
    const common = {
        "aria-hidden": true,
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.9",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    };

    if (name === "clock") {
        return <svg {...common}>
            <circle cx="12" cy="12" r="8"/>
            <path d="M12 8v4l2.5 1.5"/>
        </svg>;
    }
    if (name === "check") {
        return <svg {...common}>
            <path d="m5 12 4 4L19 6"/>
        </svg>;
    }
    if (name === "person") {
        return <svg {...common}>
            <circle cx="12" cy="8" r="3"/>
            <path d="M5 20c.7-3.1 3.1-5 7-5s6.3 1.9 7 5"/>
        </svg>;
    }
    return <svg {...common}>
        <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/>
        <path d="M14 3.5V8h4M8.5 12H15.5M8.5 16H15.5"/>
    </svg>;
}

function StatusBadge({state, copy}) {
    const styles = {
        waiting: "border-gold/60 bg-gold/20 text-ink",
        ready: "border-pink bg-pink/60 text-ink",
        signed: "border-green-200 bg-green-50 text-green-800",
        declined: "border-peach bg-peach/45 text-ink",
    };
    const icons = {waiting: "clock", ready: "file", signed: "check", declined: "clock"};

    return (
        <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${styles[state]}`}>
            <ContractIcon name={icons[state]} className="h-3.5 w-3.5"/>
            {copy.status[state]}
        </span>
    );
}

export default function EmployerContractsPage({
                                                  user,
                                                  contracts = [],
                                                  onContractSigned,
                                                  workspaceTabs,
                                                  embedded = false
                                              }) {
    const {i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const copy = {
        fr: {
            eyebrow: "Espace employeur",
            title: "Mes contrats de stage",
            description: "Suivez les signatures de vos ententes et signez chaque contrat une fois la réponse de l’étudiant reçue.",
            total: "Contrats envoyés",
            waiting: "En attente de l’étudiant",
            ready: "À signer",
            signed: "Signés par vous",
            listEyebrow: "Vos ententes",
            listTitle: "Contrats envoyés aux étudiants",
            listDescription: "Chaque contrat devient accessible lorsque l’étudiant l’a signé.",
            contractNumber: "Contrat no",
            student: "Étudiant",
            position: "Poste",
            sentOn: "Début du stage",
            notSpecified: "Non précisé",
            viewAndSign: "Consulter et signer",
            viewContract: "Consulter le contrat",
            closeContract: "Fermer le contrat",
            selectedContract: "Contrat sélectionné",
            waitingForStudentTitle: "En attente de la signature de l’étudiant",
            waitingForStudentDescription: "Vous pourrez signer ce contrat après que l’étudiant l’aura signé.",
            status: {
                waiting: "En attente de la réponse de l’étudiant",
                ready: "Votre signature est requise",
                signed: "Signé par vous",
                declined: "Réponse de l’étudiant refusée",
            },
            waitingMessage: "Nous attendons la réponse de l’étudiant. Vous pourrez consulter et signer ce contrat après sa signature.",
            signedMessage: "Votre signature a été enregistrée. Vous pouvez consulter cette entente en tout temps.",
            declinedMessage: "L’étudiant a refusé cette entente.",
            emptyTitle: "Aucun contrat envoyé",
            emptyDescription: "Vous n’avez encore envoyé aucun contrat à un étudiant. Les contrats à signer apparaîtront ici après leur envoi.",
        },
        en: {
            eyebrow: "Employer area",
            title: "My internship contracts",
            description: "Track agreement signatures and sign each contract once the student has responded.",
            total: "Contracts sent",
            waiting: "Waiting for student",
            ready: "To sign",
            signed: "Signed by you",
            listEyebrow: "Your agreements",
            listTitle: "Contracts sent to students",
            listDescription: "Each contract becomes available once the student has signed it.",
            contractNumber: "Contract no.",
            student: "Student",
            position: "Position",
            sentOn: "Internship start",
            notSpecified: "Not specified",
            viewAndSign: "Review and sign",
            viewContract: "View contract",
            closeContract: "Close contract",
            selectedContract: "Selected contract",
            waitingForStudentTitle: "Waiting for the student’s signature",
            waitingForStudentDescription: "You can sign this contract after the student has signed it.",
            status: {
                waiting: "Waiting for the student's response",
                ready: "Your signature is required",
                signed: "Signed by you",
                declined: "Student declined",
            },
            waitingMessage: "We are waiting for the student’s response. You can review and sign this contract after the student signs it.",
            signedMessage: "Your signature was recorded. You can review this agreement at any time.",
            declinedMessage: "The student declined this agreement.",
            emptyTitle: "No contracts sent",
            emptyDescription: "You have not sent a contract to a student yet. Contracts waiting for your signature will appear here after they are sent.",
        },
    }[language];
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [locallySignedContracts, setLocallySignedContracts] = useState({});
    const [demoContracts, setDemoContracts] = useState([]);

    useEffect(() => {
        if (!isDemoEmployer(user)) {
            setDemoContracts([]);
            return undefined;
        }

        const refreshDemoContracts = () => setDemoContracts(getDemoContracts());
        const refreshOnVisibility = () => {
            if (document.visibilityState === "visible") refreshDemoContracts();
        };
        refreshDemoContracts();
        window.addEventListener("storage", refreshDemoContracts);
        window.addEventListener(DEMO_CONTRACTS_UPDATED_EVENT, refreshDemoContracts);
        window.addEventListener("focus", refreshDemoContracts);
        document.addEventListener("visibilitychange", refreshOnVisibility);
        return () => {
            window.removeEventListener("storage", refreshDemoContracts);
            window.removeEventListener(DEMO_CONTRACTS_UPDATED_EVENT, refreshDemoContracts);
            window.removeEventListener("focus", refreshDemoContracts);
            document.removeEventListener("visibilitychange", refreshOnVisibility);
        };
    }, [user]);

    const allContracts = useMemo(() => {
        const combined = [...getContractList(contracts), ...demoContracts];
        const unique = new Map();
        combined.forEach((contract, index) => unique.set(contractId(contract, index), contract));
        return [...unique.values()];
    }, [contracts, demoContracts]);

    const contractList = useMemo(() => allContracts.map((contract, index) => {
        const id = contractId(contract, index);
        const declined = hasStudentDeclined(contract);
        const studentSigned = !declined && hasStudentSigned(contract);
        const employerSigned = hasEmployerSigned(contract) || Boolean(locallySignedContracts[id]);
        const state = declined ? "declined" : !studentSigned ? "waiting" : employerSigned ? "signed" : "ready";

        return {contract, id, studentSigned, employerSigned, state};
    }), [allContracts, locallySignedContracts]);

    const selectedContract = contractList.find(({id}) => id === selectedContractId && id !== null);
    const signableContract = selectedContract?.studentSigned ? selectedContract : null;
    const totals = contractList.reduce((counts, {state}) => ({...counts, [state]: counts[state] + 1}), {
        waiting: 0,
        ready: 0,
        signed: 0,
        declined: 0,
    });

    const markContractSigned = (entry) => {
        setLocallySignedContracts((current) => ({...current, [entry.id]: true}));
        if (isDemoEmployer(user) && entry.id.startsWith("demo-")) {
            const updated = saveDemoContract({
                ...entry.contract,
                contractStatus: "EMPLOYER_SIGNED",
                employerSigned: true,
                employerSignedAt: new Date().toISOString(),
            });
            setDemoContracts(updated);
        }
        onContractSigned?.(entry.contract);
    };

    useEffect(() => {
        if (!signableContract) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setSelectedContractId(null);
        };
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [signableContract?.id]);

    return (
        <section className={embedded ? "bg-canvas" : "flex-1 bg-canvas px-4 py-8 sm:px-6 sm:py-10 lg:px-8"}>
            <div className="mx-auto w-full max-w-7xl">
                {!embedded && <header>
                    <span
                        className="inline-flex w-fit rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {copy.eyebrow}
                    </span>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{copy.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{copy.description}</p>
                </header>}

                {!embedded && workspaceTabs}

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        [copy.total, contractList.length, "bg-surface"],
                        [copy.waiting, totals.waiting, "bg-gold/15"],
                        [copy.ready, totals.ready, "bg-pink/30"],
                        [copy.signed, totals.signed, "bg-green-50"],
                    ].map(([label, value, background]) => (
                        <div key={label}
                             className={`flex items-center justify-between rounded-xl border border-line p-3 shadow-[0_6px_18px_rgba(48,35,55,0.04)] ${background}`}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{label}</p>
                            <p className="text-xl font-black text-ink">{value}</p>
                        </div>
                    ))}
                </div>

                <section
                    className="mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-6"
                    aria-labelledby="employer-contracts-list">
                    <div className="rounded-2xl border border-line bg-canvas p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{copy.listEyebrow}</p>
                        <h2 id="employer-contracts-list"
                            className="mt-1 text-xl font-black tracking-tight text-ink">{copy.listTitle}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{copy.listDescription}</p>
                    </div>

                    {contractList.length === 0 ? (
                        <div className="mt-5 rounded-2xl border border-dashed border-line bg-canvas p-7 text-center"
                             role="status">
                            <span
                                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink text-ink"><ContractIcon
                                name="file" className="h-5 w-5"/></span>
                            <h3 className="mt-4 text-base font-black text-ink">{copy.emptyTitle}</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{copy.emptyDescription}</p>
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-3 lg:grid-cols-2">
                            {contractList.map((entry) => {
                                const {contract, id, state} = entry;
                                const student = studentName(contract) || copy.notSpecified;
                                const position = contractPosition(contract) || copy.notSpecified;
                                const startDate = formatDate(contractStartDate(contract), language) || copy.notSpecified;
                                const isOpen = selectedContractId === id;

                                return (
                                    <article key={id}
                                             className={`rounded-2xl border p-4 transition-colors ${isOpen ? "border-ink bg-lavender/25" : "border-line bg-canvas"}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">{copy.contractNumber} {id}</p>
                                                <p className="mt-1 truncate text-base font-black text-ink">{position}</p>
                                            </div>
                                            <StatusBadge state={state} copy={copy}/>
                                        </div>

                                        <dl className="mt-4 grid gap-3 border-y border-line py-3 text-sm sm:grid-cols-2">
                                            <div className="min-w-0">
                                                <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                                                    <ContractIcon name="person" className="h-3.5 w-3.5"/>{copy.student}
                                                </dt>
                                                <dd className="mt-1 truncate font-bold text-ink">{student}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{copy.sentOn}</dt>
                                                <dd className="mt-1 font-bold text-ink">{startDate}</dd>
                                            </div>
                                        </dl>

                                        <div className="mt-3 min-h-11 text-xs leading-5 text-ink-soft">
                                            {state === "waiting" && <p>{copy.waitingMessage}</p>}
                                            {state === "signed" && <p>{copy.signedMessage}</p>}
                                            {state === "declined" && <p>{copy.declinedMessage}</p>}
                                        </div>

                                        {(state === "ready" || state === "signed") && (
                                            <button type="button"
                                                    onClick={() => setSelectedContractId(isOpen ? null : id)}
                                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/40">
                                                <ContractIcon name="file" className="h-4 w-4"/>
                                                {isOpen ? copy.closeContract : state === "ready" ? copy.viewAndSign : copy.viewContract}
                                            </button>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {signableContract && (
                    <div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-6"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setSelectedContractId(null);
                        }}
                    >
                        <section
                            className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-line bg-canvas shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)]"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="employer-selected-contract-title"
                        >
                            <header
                                className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-7">
                                <h2 id="employer-selected-contract-title"
                                    className="text-base font-black text-ink sm:text-lg">
                                    {copy.selectedContract} · {copy.contractNumber} {signableContract.id}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSelectedContractId(null)}
                                    aria-label={copy.closeContract}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                >
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="m6 6 12 12M18 6 6 18"/>
                                    </svg>
                                </button>
                            </header>
                            <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
                                <ContractSignaturePage
                                    key={signableContract.id}
                                    user={user}
                                    contract={{
                                        ...signableContract.contract,
                                        employerSigned: signableContract.employerSigned
                                    }}
                                    signer="employer"
                                    onSigned={() => markContractSigned(signableContract)}
                                />
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </section>
    );
}
