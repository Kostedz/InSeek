import {useState} from "react";
import {useTranslation} from "react-i18next";
import PdfPreview from "../PdfPreview.jsx";
import api from "../../utils/api.js";

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

function hasRecordedSignature(value) {
    if (value === true) return true;
    if (!value) return false;
    if (typeof value === "object") {
        if (value.signedAt || value.date) return true;
        return hasRecordedSignature(value.signed ?? value.isSigned ?? value.status);
    }
    return ["TRUE", "SIGNED", "COMPLETE", "COMPLETED"].includes(String(value).trim().toUpperCase());
}

function signatureName(user, nested, flatName) {
    return [
        user?.firstName ?? user?.prenom ?? nested?.prenom ?? nested?.firstName,
        user?.lastName ?? user?.nom ?? nested?.nom ?? nested?.lastName,
    ].filter(Boolean).join(" ") || flatName || "";
}

function CheckIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6"/>
        </svg>
    );
}

export default function ContractSignaturePage({
                                                  user,
                                                  contract,
                                                  contractLoading = false,
                                                  signer = "student",
                                                  onSigned,
                                                  allowPrint = false,
                                                  readOnly = false,
                                                  readOnlyMessage,
                                              }) {
    const {t} = useTranslation();
    const [hasSignature, setHasSignature] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isLocallySigned, setIsLocallySigned] = useState(false);
    const [signatureError, setSignatureError] = useState("");
    const [pdfRevision, setPdfRevision] = useState(0);

    const signerIsEmployer = signer === "employer";
    const signerIsManager = signer === "manager";
    const contractNumber = contract?.contractId ?? contract?.id;
    const backendStatus = String(contract?.contractStatus ?? contract?.status ?? "").toUpperCase();
    const isDemoContract = contractNumber === "demo-camille-nexora-1";
    const hasGeneratedPdf = /^\d+$/.test(String(contractNumber ?? "")) && Number(contractNumber) > 0;
    const studentName = signatureName(null, contract?.student, contract?.studentFullName ?? contract?.studentName);
    const employerName = signatureName(null, contract?.employee ?? contract?.employer,
        contract?.employerFullName ?? contract?.companyName);
    const managerName = signatureName(null, contract?.admin, contract?.managerFullName ?? contract?.assignedTeacherName);
    const signerName = signatureName(user,
        signerIsEmployer ? contract?.employee ?? contract?.employer : signerIsManager ? contract?.admin : contract?.student,
        signerIsEmployer ? contract?.employerFullName : signerIsManager ? contract?.managerFullName : contract?.studentFullName);

    const studentSigned = hasRecordedSignature(contract?.studentSigned ?? contract?.studentSignedAt
            ?? contract?.signatureEtudiant ?? contract?.signatures?.student)
        || ["SIGNED_BY_STUDENT", "SIGNED_BY_EMPLOYER", "SIGNED_BY_GESTIONNAIRE", "EXECUTED", "FULLY_SIGNED", "COMPLETED"].includes(backendStatus);
    const employerSigned = hasRecordedSignature(contract?.employerSigned ?? contract?.employerSignedAt
            ?? contract?.signatureEmployeur ?? contract?.signatures?.employer)
        || ["SIGNED_BY_EMPLOYER", "SIGNED_BY_GESTIONNAIRE", "EXECUTED", "FULLY_SIGNED", "COMPLETED"].includes(backendStatus);
    const managerSigned = hasRecordedSignature(contract?.managerSigned ?? contract?.managerSignedAt
            ?? contract?.signatureGestionnaire ?? contract?.signatures?.manager)
        || ["SIGNED_BY_GESTIONNAIRE", "EXECUTED", "FULLY_SIGNED", "COMPLETED"].includes(backendStatus);
    const isSigned = (signerIsEmployer ? employerSigned : signerIsManager ? managerSigned : studentSigned) || isLocallySigned;
    const isLocked = readOnly && !isSigned;
    const isWaitingForStudent = signerIsEmployer && !studentSigned && !employerSigned;

    const submitSignature = async (event) => {
        event.preventDefault();
        if (isSigned || isSigning || !hasSignature) return;
        setIsSigning(true);
        setSignatureError("");
        try {
            await onSigned?.(contract);
            setIsLocallySigned(true);
            setPdfRevision((revision) => revision + 1);
        } catch (error) {
            const key = error?.message === "signature_unauthorized"
                ? "contractSignature.reauthenticate"
                : error?.message === "signature_forbidden"
                    ? "contractSignature.signatureForbidden"
                    : "contractSignature.signingError";
            setSignatureError(t(key));
        } finally {
            setIsSigning(false);
        }
    };

    const downloadPdf = async () => {
        try {
            const response = isDemoContract
                ? await api.student.getDemoContractPdf({
                    studentSignedAt: contract?.studentSignedAt,
                    employerSignedAt: contract?.employerSignedAt,
                    managerSignedAt: contract?.managerSignedAt,
                })
                : await api.student.getContractPdf(contractNumber);
            if (!response.ok) throw new Error("pdf_download_failed");
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = url;
            link.download = `contrat-stage-${contractNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            setSignatureError(t("pdfPreview.loadError"));
        }
    };

    return (
        <div
            className="mt-7 overflow-hidden rounded-[1.75rem] border border-line bg-canvas shadow-[0_18px_50px_rgba(48,35,55,0.07)]">
            <div
                className="flex flex-col gap-4 bg-gradient-to-br from-ink via-ink to-[#5d426b] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">{t("contractSignature.eyebrow")}</p>
                    <p className="mt-1 text-lg font-black tracking-tight">{t("contractSignature.preview")}</p>
                    <p className="mt-0.5 text-xs font-semibold text-white/60">
                        {t("contractSignature.contractNumber")}: {contractNumber ?? "—"}
                    </p>
                </div>
                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${isSigned ? "border-green-200/30 bg-green-300/15 text-green-100" : "border-gold/40 bg-gold/15 text-gold"}`}>
                    <span className={`h-2 w-2 rounded-full ${isSigned ? "bg-green-300" : "bg-gold"}`}/>
                    {isSigned ? t("contractSignature.signedStatus") : t("contractSignature.status")}
                </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(290px,0.7fr)] lg:items-start">
                <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                    {contractLoading ? (
                        <p className="rounded-xl bg-lavender/30 px-4 py-6 text-center text-sm text-ink-soft">{t("pdfPreview.loading")}</p>
                    ) : hasGeneratedPdf || isDemoContract ? (
                        <PdfPreview
                            key={`${contractNumber}-${backendStatus}-${pdfRevision}`}
                            contractId={hasGeneratedPdf ? contractNumber : null}
                            demoContract={isDemoContract}
                            studentSignedAt={contract?.studentSignedAt ?? ""}
                            employerSignedAt={contract?.employerSignedAt ?? ""}
                            managerSignedAt={contract?.managerSignedAt ?? ""}
                            fileName={`Contrat ${contractNumber}.pdf`}
                            className="border-0 bg-transparent p-0"
                        />
                    ) : (
                        <p className="rounded-xl border border-line px-4 py-6 text-center text-sm text-ink-soft">
                            {t("studentContract.noContract")}
                        </p>
                    )}
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
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700"><CheckIcon/></span>
                            <div className="pr-12">
                                <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.confirmationTitle")}</h2>
                                <p className="mt-1 text-xs leading-5 text-ink-soft">{t("contractSignature.signedDescription")}</p>
                            </div>
                            <p className="mt-3 text-[11px] font-bold text-green-800">{t("contractSignature.immutable")}</p>
                        </div>
                    ) : isLocked ? (
                        <div className="rounded-2xl border border-gold/60 bg-gold/15 p-5" role="status">
                            <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.lockedTitle")}</h2>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">{readOnlyMessage ?? t("contractSignature.lockedDescription")}</p>
                        </div>
                    ) : (
                        <form onSubmit={submitSignature}
                              className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-lg font-black tracking-tight text-ink">{t("contractSignature.signatureTitle")}</h2>
                            <p className="mt-1 text-xs leading-5 text-ink-soft">{t("contractSignature.signatureMeaning")}</p>
                            <div className="mt-4 rounded-xl border border-gold bg-gold/20 px-3 py-2.5">
                                <p className="text-xs font-black text-ink">{t("contractSignature.secure")}</p>
                                <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{t("contractSignature.secureText")}</p>
                            </div>
                            {signatureError &&
                                <p className="mt-3 rounded-xl border border-error bg-blush/30 px-3 py-2 text-xs font-semibold text-error"
                                   role="alert">{signatureError}</p>}
                            <div
                                className="relative mt-4 h-32 overflow-hidden rounded-xl border-2 border-line bg-canvas">
                                {hasSignature && <span className="absolute bottom-7 left-5 text-3xl italic text-ink"
                                                       style={{fontFamily: "'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive"}}>{signerName}</span>}
                                <span
                                    className="pointer-events-none absolute bottom-4 left-5 right-5 border-b border-ink/30"/>
                                {!hasSignature && <button type="button" onClick={() => setHasSignature(true)}
                                                          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border border-ink/15 bg-surface/95 px-3 py-1.5 text-xs font-black text-ink shadow-sm hover:bg-pink"
                                                          disabled={isSigning}>{t("contractSignature.signWithName")}</button>}
                            </div>
                            <button type="submit" disabled={!hasSignature || isSigning}
                                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-colors ${hasSignature && !isSigning ? "bg-ink text-white hover:bg-ink-soft" : "cursor-not-allowed bg-line text-ink-soft"}`}>
                                {isSigning ? t("contractSignature.signing") : t("contractSignature.confirmSignature")}
                            </button>
                        </form>
                    )}

                    {allowPrint && isSigned && hasGeneratedPdf && (
                        <button type="button" onClick={downloadPdf}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-black text-white hover:bg-ink-soft print:hidden">
                            {t("contractSignature.downloadPrint")}
                        </button>
                    )}
                    {!isSigned && <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs">
                        <p className="font-black uppercase tracking-[0.1em] text-ink-soft">{t("contractSignature.signingOrderLabel")}</p>
                        <p className="mt-1 font-bold text-ink">{signerIsEmployer ? t("contractSignature.employerSigningOrder") : signerIsManager ? t("contractSignature.managerSigningOrder") : t("contractSignature.signingOrder")}</p>
                    </div>}
                </aside>
            </div>
        </div>
    );
}
