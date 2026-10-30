import {useState} from "react";
import {useTranslation} from "react-i18next";

const DEMO_CONTRACTS_KEY = "inseek.demo.contracts";
const DEMO_EMPLOYER_EMAIL = "demo.employeur@inseek.local";
export const DEMO_CONTRACTS_UPDATED_EVENT = "inseek:demo-contracts-updated";

function notifyDemoContractsUpdated() {
    window.dispatchEvent(new Event(DEMO_CONTRACTS_UPDATED_EVENT));
}

export function isDemoEmployer(user) {
    return String(user?.email ?? "").toLowerCase() === DEMO_EMPLOYER_EMAIL;
}

export function getDemoContracts() {
    try {
        const stored = JSON.parse(localStorage.getItem(DEMO_CONTRACTS_KEY) ?? "[]");
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

export function clearDemoContracts() {
    localStorage.removeItem(DEMO_CONTRACTS_KEY);
    notifyDemoContractsUpdated();
}

export function saveDemoContract(contract) {
    const contracts = getDemoContracts();
    const id = String(contract?.contractId ?? contract?.id ?? "");
    const existingIndex = contracts.findIndex((item) => String(item?.contractId ?? item?.id ?? "") === id);
    const next = [...contracts];

    if (existingIndex < 0) next.push(contract);
    else next[existingIndex] = {...next[existingIndex], ...contract};

    localStorage.setItem(DEMO_CONTRACTS_KEY, JSON.stringify(next));
    notifyDemoContractsUpdated();
    return next;
}

function ContractValue({value, label}) {
    const isMissing = value === null || value === undefined || value === "";
    return <strong className="font-black text-ink">{isMissing ? label : value}</strong>;
}

function CheckIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6"/>
        </svg>
    );
}

function hasRecordedSignature(value) {
    if (value === true) return true;
    if (!value) return false;
    if (typeof value === "object") {
        if (value.signedAt || value.date) return true;
        return hasRecordedSignature(value.signed ?? value.isSigned ?? value.status);
    }
    return ["TRUE", "SIGNED", "COMPLETE", "COMPLETED"].includes(String(value).trim().toUpperCase());
}

export default function ContractSignaturePage({
                                                  user,
                                                  contract,
                                                  signer = "student",
                                                  onSigned,
                                                  readOnly = false,
                                                  readOnlyMessage
                                              }) {
    const {t, i18n} = useTranslation();
    const [hasSignature, setHasSignature] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isLocallySigned, setIsLocallySigned] = useState(false);
    const [signatureError, setSignatureError] = useState("");

    const student = contract?.student ?? {};
    const employee = contract?.employee ?? {};
    const internshipOffer = contract?.internshipOffer ?? {};
    const admin = contract?.admin ?? {};
    const signerIsEmployer = signer === "employer";
    const firstName = student.prenom ?? student.firstName ?? (signerIsEmployer ? undefined : user?.firstName ?? user?.prenom);
    const lastName = student.nom ?? student.lastName ?? (signerIsEmployer ? undefined : user?.lastName ?? user?.nom);
    const signerFirstName = signerIsEmployer
        ? user?.firstName ?? user?.prenom ?? employee.prenom
        : firstName;
    const signerLastName = signerIsEmployer
        ? user?.lastName ?? user?.nom ?? employee.nom
        : lastName;
    const signerName = [signerFirstName, signerLastName].filter(Boolean).join(" ");
    const employerName = employee.nomCompagnie ?? employee.companyName ?? internshipOffer.nomEntreprise ?? internshipOffer.companyName;
    const position = internshipOffer.position ?? internshipOffer.title ?? contract?.position;
    const positionDescription = internshipOffer.descriptionPosition ?? internshipOffer.description ?? contract?.description;
    const startDate = contract?.startingDate ?? contract?.startDate;
    const endDate = contract?.endingDate ?? contract?.endDate;
    const weeklyHours = contract?.weeklyHours ?? contract?.hoursPerWeek;
    const hourlySalary = contract?.hourlySalary ?? contract?.salary;
    const location = contract?.internshipLocation ?? contract?.location;
    const contractNumber = contract?.contractId ?? contract?.id;
    const backendStatus = String(contract?.contractStatus ?? "").toUpperCase();
    const employerSignatureRecorded = hasRecordedSignature(
        contract?.employerSigned
        ?? contract?.isEmployerSigned
        ?? contract?.signedByEmployer
        ?? contract?.employerSignature
        ?? contract?.signatureEmployeur
        ?? contract?.signatures?.employer
    ) || ["EMPLOYER_SIGNED", "SIGNED_BY_EMPLOYER", "FULLY_SIGNED", "COMPLETED"].includes(backendStatus);
    const studentSignatureRecorded = hasRecordedSignature(
        contract?.studentSigned
        ?? contract?.isStudentSigned
        ?? contract?.signedByStudent
        ?? contract?.studentSignature
        ?? contract?.signatureEtudiant
        ?? contract?.signatures?.student
    ) || ["STUDENT_SIGNED", "SIGNED_BY_STUDENT", "PENDING_EMPLOYER_SIGNATURE", "EMPLOYER_SIGNATURE_REQUIRED", "EMPLOYER_SIGNING", "EMPLOYER_SIGNED", "SIGNED_BY_EMPLOYER", "FULLY_SIGNED", "COMPLETED"].includes(backendStatus);
    const isSigned = (signerIsEmployer
        ? employerSignatureRecorded
        : studentSignatureRecorded || backendStatus === "SIGNED") || isLocallySigned;
    const isLocked = readOnly && !isSigned;
    const isWaitingForStudent = signerIsEmployer && !studentSignatureRecorded && !employerSignatureRecorded && !isLocallySigned;

    const formatDate = (value) => {
        if (!value) return "";
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
        return Number.isNaN(date.getTime())
            ? String(value)
            : new Intl.DateTimeFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {dateStyle: "medium"}).format(date);
    };

    const formatSalary = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const amount = Number(value);
        return Number.isNaN(amount)
            ? String(value)
            : new Intl.NumberFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {
                style: "currency",
                currency: "CAD"
            }).format(amount);
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const formattedSalary = formatSalary(hourlySalary);
    const formattedWeeklyHours = weeklyHours === null || weeklyHours === undefined || weeklyHours === ""
        ? ""
        : `${weeklyHours} h`;

    const signWithName = () => {
        if (isSigned || isSigning) return;
        setHasSignature(true);
    };

    const submitSignature = async (event) => {
        event.preventDefault();
        if (isSigned || !hasSignature) return;

        setIsSigning(true);
        setSignatureError("");
        try {
            await onSigned?.(contract);
            setIsLocallySigned(true);
        } catch {
            setSignatureError(t("contractSignature.signingError"));
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div
            className="mt-7 overflow-hidden rounded-[1.75rem] border border-line bg-canvas shadow-[0_18px_50px_rgba(48,35,55,0.07)]">
            <div
                className="flex flex-col gap-4 bg-gradient-to-br from-ink via-ink to-[#5d426b] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink text-ink">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor"
                             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7.5h16v12H4zM8 7.5V5h8v2.5M8 12h8M8 15.5h5"/>
                        </svg>
                    </span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">{t("contractSignature.eyebrow")}</p>
                        <p className="mt-1 text-lg font-black tracking-tight">{t("contractSignature.preview")}</p>
                        <p className="mt-0.5 text-xs font-semibold text-white/60">{t("contractSignature.contractNumber")}: <ContractValue
                            value={contractNumber} label={t("contractSignature.contractNumber")}/></p>
                    </div>
                </div>
                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${isSigned ? "border-green-200/30 bg-green-300/15 text-green-100" : "border-gold/40 bg-gold/15 text-gold"}`}>
                    <span className={`h-2 w-2 rounded-full ${isSigned ? "bg-green-300" : "bg-gold"}`}/>
                    {isSigned ? t("contractSignature.signedStatus") : isLocked ? t("contractSignature.lockedTitle") : t("contractSignature.status")}
                </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(290px,0.7fr)] lg:items-start">
                <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                    <div className="flex items-center gap-3 border-b border-line pb-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink text-ink">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path
                                    d="M4 21h16M6 21V5l6-3 6 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/>
                            </svg>
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-soft">{t("contractSignature.preview")}</p>
                            <p className="mt-1 text-sm font-black text-ink">{t("contractSignature.eyebrow")}</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4 text-sm leading-7 text-ink-soft">
                        <p>
                            {t("contractSignature.contractIntro")} <ContractValue value={firstName}
                                                                                  label={t("contractSignature.firstName")}/>{" "}
                            <ContractValue value={lastName}
                                           label={t("contractSignature.lastName")}/> {t("contractSignature.and")}{" "}
                            <ContractValue value={employerName}
                                           label={t("contractSignature.company")}/> {t("contractSignature.representedBy")}{" "}
                            <ContractValue value={employee.prenom}
                                           label={t("contractSignature.employerFirstName")}/>{" "}<ContractValue
                            value={employee.nom}
                            label={t("contractSignature.employerLastName")}/>. {t("contractSignature.supervisorIntro")}{" "}
                            <ContractValue value={contract?.supervisorName}
                                           label={t("contractSignature.supervisor")}/> {t("contractSignature.managerIntro")}{" "}
                            <ContractValue value={admin.prenom}
                                           label={t("contractSignature.managerFirstName")}/>{" "}<ContractValue
                            value={admin.nom} label={t("contractSignature.managerLastName")}/>.
                        </p>

                        <p>
                            {t("contractSignature.internshipIntro")} <ContractValue value={position}
                                                                                    label={t("contractSignature.position")}/>. {t("contractSignature.descriptionIntro")}{" "}
                            <ContractValue value={positionDescription} label={t("contractSignature.description")}/>
                        </p>

                        <p>
                            {t("contractSignature.periodIntro")} <ContractValue value={formattedStartDate}
                                                                                label={t("contractSignature.startDate")}/> {t("contractSignature.periodSeparator")}{" "}
                            <ContractValue value={formattedEndDate}
                                           label={t("contractSignature.endDate")}/>. {t("contractSignature.locationIntro")}{" "}
                            <ContractValue value={location}
                                           label={t("contractSignature.location")}/>. {t("contractSignature.hoursIntro")}{" "}
                            <ContractValue value={formattedWeeklyHours}
                                           label={t("contractSignature.weeklyHours")}/> {t("contractSignature.hoursSuffix")} {t("contractSignature.salaryIntro")}{" "}
                            <ContractValue value={formattedSalary}
                                           label={t("contractSignature.hourlySalary")}/> {t("contractSignature.salarySuffix")}
                        </p>

                        <div className="border-t border-line pt-4">
                            <h2 className="text-sm font-black text-ink">{t("contractSignature.commitmentsTitle")}</h2>
                            <p className="mt-2">{t("contractSignature.studentCommitment")}</p>
                            <p className="mt-2">{t("contractSignature.employerCommitment")}</p>
                            <p className="mt-2">{t("contractSignature.modificationCommitment")}</p>
                        </div>
                    </div>
                </article>

                <aside className="lg:sticky lg:top-6">
                    {isWaitingForStudent ? (
                        <div className="rounded-2xl border border-gold/60 bg-gold/15 p-5" role="status">
                            <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.waitingForStudentTitle")}</h2>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">{t("contractSignature.waitingForStudentDescription")}</p>
                        </div>
                    ) : isSigned ? (
                        <div className="relative rounded-2xl border border-green-200 bg-green-50 p-5">
                            <span
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700">
                                <CheckIcon/>
                            </span>
                            <div className="pr-12">
                                <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.confirmationTitle")}</h2>
                                <p className="mt-1 text-xs leading-5 text-ink-soft">{t("contractSignature.signedDescription")}</p>
                            </div>
                            <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-green-800"><span
                                className="h-2 w-2 rounded-full bg-green-600"/>{t("contractSignature.immutable")}</p>
                        </div>
                    ) : isLocked ? (
                        <div className="rounded-2xl border border-gold/60 bg-gold/15 p-5" role="status">
                            <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.lockedTitle")}</h2>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">{readOnlyMessage ?? t("contractSignature.lockedDescription")}</p>
                        </div>
                    ) : (
                        <form onSubmit={submitSignature}
                              className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.signatureTitle")}</h2>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">{t("contractSignature.signatureMeaning")}</p>
                                </div>
                                <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/35 text-ink">
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                         strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path
                                        d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                                </span>
                            </div>

                            <div className="mt-4 rounded-xl border border-gold bg-gold/20 px-3 py-2.5">
                                <p className="text-xs font-black text-ink">{t("contractSignature.secure")}</p>
                                <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{t("contractSignature.secureText")}</p>
                            </div>

                            <div
                                className="relative mt-4 h-32 overflow-hidden rounded-xl border-2 border-line bg-canvas">
                                {hasSignature && (
                                    <span className="absolute bottom-7 left-5 text-3xl italic text-ink"
                                          style={{fontFamily: "'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive"}}>
                                        {signerName}
                                    </span>
                                )}
                                <span
                                    className="pointer-events-none absolute bottom-4 left-5 right-5 border-b border-ink/30"/>
                                {!hasSignature && (
                                    <button type="button" onClick={signWithName}
                                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border border-ink/15 bg-surface/95 px-3 py-1.5 text-xs font-black text-ink shadow-sm transition-colors hover:bg-pink disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isSigning}>
                                        {t("contractSignature.signWithName")}
                                    </button>
                                )}
                            </div>

                            <button type="submit" disabled={!hasSignature || isSigning}
                                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-colors ${hasSignature && !isSigning ? "bg-ink text-white hover:bg-ink-soft" : "cursor-not-allowed bg-line text-ink-soft"}`}>
                                {isSigning ? t("contractSignature.signing") : t("contractSignature.confirmSignature")}
                                {hasSignature && !isSigning &&
                                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path d="M5 12h14M13 6l6 6-6 6"/>
                                    </svg>}
                            </button>
                            {signatureError &&
                                <p className="mt-3 text-sm font-semibold text-error" role="alert">{signatureError}</p>}
                        </form>
                    )}

                    {!isSigned && (
                        <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs">
                            <p className="font-black uppercase tracking-[0.1em] text-ink-soft">{t("contractSignature.signingOrderLabel")}</p>
                            <p className="mt-1 font-bold text-ink">{signerIsEmployer ? t("contractSignature.employerSigningOrder") : t("contractSignature.signingOrder")}</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
