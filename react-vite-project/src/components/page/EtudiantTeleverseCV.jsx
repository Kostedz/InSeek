import React, { useState, useRef } from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {api} from "../../utils/api.js";
import {translateMessage} from "../../utils/i18nMessage.js";

function normalizeStatus(status) {
    const normalized = String(status ?? "").toUpperCase();
    if (["VALIDATED", "VALIDÉ", "VALIDE", "APPROVED"].includes(normalized)) return "VALIDE";
    if (["REJECTED", "REJETÉ", "REJETE", "REJECT"].includes(normalized)) return "REJETE";
    if (["PENDING", "EN_ATTENTE", "EN ATTENTE"].includes(normalized)) return "EN_ATTENTE";
    return "NOT_SUBMITTED";
}

function formatFileSizeInMb(size, locale) {
    const bytes = Number(size);
    if (!Number.isFinite(bytes) || bytes < 0) return "";

    return new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(bytes / (1024 * 1024));
}

export default function EtudiantTeleverseCV({user, cvData, isAccountEmailValidated = true, onCvUpdated}) {
    const {t, i18n} = useTranslation();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentCv, setCurrentCv] = useState(cvData ?? null);

    React.useEffect(() => {
        if (cvData !== undefined) {
            setCurrentCv(cvData);
            return;
        }

        let isMounted = true;

        api.student.getCv()
            .then(async (response) => {
                if (!isMounted) return;

                if (response.status === 204 || response.status === 404) {
                    setCurrentCv(null);
                    return;
                }

                if (!response.ok) {
                    throw new Error("student_cv_request_failed");
                }

                setCurrentCv(await response.json());
            })
            .catch(() => {
                if (isMounted) setErrorMessage("studentCv.errors.connection");
            });

        return () => {
            isMounted = false;
        };
    }, [cvData]);

    const status = normalizeStatus(currentCv?.statut ?? currentCv?.status);
    const rejectionComment = currentCv?.commentaireRejet ?? currentCv?.rejectionComment ?? "";
    const fileName = currentCv?.fileName ?? currentCv?.filename ?? "";
    const fileSize = currentCv?.size ?? currentCv?.fileSize;
    const formattedFileSize = formatFileSizeInMb(fileSize, i18n.language === "fr" ? "fr-CA" : "en-CA");
    const statusLabels = {
        EN_ATTENTE: translateMessage(t, "studentCv.status.pending"),
        VALIDE: translateMessage(t, "studentCv.status.approved"),
        REJETE: translateMessage(t, "studentCv.status.rejected"),
        NOT_SUBMITTED: translateMessage(t, "studentCv.status.none"),
    };

    const validateFile = (file) => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!file) return false;

        if (file.type !== "application/pdf") {
            setErrorMessage("studentCv.errors.invalidFormat");
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("studentCv.errors.fileTooLarge");
            return false;
        }

        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (isAccountEmailValidated) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isAccountEmailValidated) return;

        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || !isAccountEmailValidated) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await api.student.uploadCv(selectedFile);

            if (res.status === 403) {
                setErrorMessage("studentCv.errors.emailNotValidated");
                return;
            }

            if (!res.ok) {
                const backendError = (await res.text()).trim();
                setErrorMessage(backendError || "studentCv.errors.uploadFailed");
                return;
            }

            const responseData = await res.json();

            const uploadedCv = {
                ...responseData,
                fileName: responseData.fileName ?? selectedFile.name,
                size: responseData.size ?? selectedFile.size,
                statut: responseData.statut ?? responseData.status ?? "EN_ATTENTE",
            };

            if (status === "VALIDE") {
                setSuccessMessage("studentCv.success.updated");
            } else if (status === "REJETE") {
                setSuccessMessage("studentCv.success.corrected");
            } else {
                setSuccessMessage("studentCv.success.uploaded");
            }

            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (onCvUpdated) {
                onCvUpdated(uploadedCv);
            }
            setCurrentCv(uploadedCv);
        } catch (err) {
            setErrorMessage(err?.key || "studentCv.errors.connection");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="flex flex-1 items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div
                className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-9">
                <span
                    className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{translateMessage(t, "studentCv.label")}</span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{translateMessage(t, "studentCv.title")}</h1>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{translateMessage(t, "studentCv.description")}</p>

                {!isAccountEmailValidated && (
                    <p className="mt-6 rounded-xl border border-peach bg-peach/40 px-4 py-3 text-sm font-medium text-ink"
                       role="alert">
                        {translateMessage(t, "studentCv.emailNotValidated")}
                    </p>
                )}

                <section className="mt-8 rounded-2xl border border-line bg-canvas p-5 sm:p-6"
                         aria-labelledby="student-cv-request-title">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="student-cv-request-title" className="text-lg font-black text-ink">
                            {translateMessage(t, "studentCv.previousRequest")}
                        </h2>
                        {currentCv && (
                            <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                                    status === "VALIDE"
                                        ? "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]"
                                        : status === "REJETE"
                                            ? "border-[#eab0bf] bg-[#fff0f3] text-error"
                                            : "border-gold bg-gold/45 text-ink"
                                }`}>
                                {statusLabels[status] ?? status}
                            </span>
                        )}
                    </div>

                    {currentCv ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                    {translateMessage(t, "studentCv.request")}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    {translateMessage(t, "studentCv.requestSubmitted")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                    {translateMessage(t, "studentCv.fileName")}
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-ink">{fileName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                    {translateMessage(t, "studentCv.fileSize")}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    {formattedFileSize ? `${formattedFileSize} ${translateMessage(t, "studentCv.fileSizeUnit")}` : "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-lavender bg-lavender/25 px-4 py-3 sm:col-span-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                    {translateMessage(t, "studentCv.nextStep")}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink">
                                    {translateMessage(t, `studentCv.nextStepDescription.${status}`)}
                                </p>
                            </div>
                            {status === "REJETE" && rejectionComment && (
                                <div className="rounded-xl border border-blush bg-blush/40 px-4 py-3 sm:col-span-3"
                                     role="status">
                                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                        {translateMessage(t, "studentCv.rejectionReason")}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-ink">{rejectionComment}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-ink-soft">{translateMessage(t, "studentCv.noPreviousRequest")}</p>
                    )}
                </section>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div
                        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                            isDragging ? "border-pink bg-pink/30" : "border-line bg-canvas"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            id="cv-file"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleFileChange}
                            disabled={!isAccountEmailValidated}
                            className="sr-only"
                        />
                        <label htmlFor="cv-file"
                               className="cursor-pointer text-sm font-bold text-ink underline decoration-pink decoration-4 underline-offset-4">
                            {translateMessage(t, "studentCv.chooseFile")}
                        </label>
                        <p className="mt-2 text-sm text-ink-soft">{translateMessage(t, "studentCv.dropFile")}</p>
                        <p className="mt-1 text-xs text-ink-soft">{translateMessage(t, "studentCv.maximumSize")}</p>
                        {selectedFile &&
                            <p className="mt-4 rounded-xl bg-lavender/45 px-3 py-2 text-sm font-semibold text-ink"
                               role="status">{selectedFile.name}</p>}
                    </div>

                    {errorMessage && (
                        <p className="rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-medium text-error" role="alert">
                            {translateMessage(t, errorMessage)}
                        </p>
                    )}
                    {successMessage && (
                        <p className="rounded-xl border border-lemon bg-lemon/45 px-4 py-3 text-sm font-medium text-ink" role="status">
                            {translateMessage(t, successMessage)}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!selectedFile || !isAccountEmailValidated || isSubmitting}
                        className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting
                            ? translateMessage(t, "studentCv.submitting")
                            : translateMessage(t, currentCv ? "studentCv.update" : "studentCv.submit")}
                    </button>

                    {currentCv && (
                        <Link
                            to="/"
                            className="inline-flex w-full items-center justify-center rounded-xl border border-line bg-lavender/45 px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-lavender focus:outline-none focus:ring-4 focus:ring-lavender/60"
                        >
                            {translateMessage(t, "studentCv.backHome")}
                        </Link>
                    )}
                </form>
            </div>
        </section>
    );
}
