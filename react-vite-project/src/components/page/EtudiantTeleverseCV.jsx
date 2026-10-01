import React, { useState, useRef } from "react";
import fetcher from "../../utils/fetcher.js";
import {useTranslation} from "react-i18next";

export default function EtudiantTeleverseCV({cvData, isAccountEmailValidated = true, onCvUpdated}) {
    const fileInputRef = useRef(null);
    const {t} = useTranslation();

    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const status = cvData?.status || "NOT_SUBMITTED";
    const rejectionComment = cvData?.rejectionComment || "";

    const validateFile = (file) => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!file) return false;

        if (file.type !== "application/pdf") {
            setErrorMessage(t("studentCv.errors.invalidFormat"));
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage(t("studentCv.errors.fileTooLarge"));
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
                setErrorMessage(t("studentCv.errors.emailNotValidated"));
                return;
            }

            if (!res.ok) {
                throw new Error(t("studentCv.errors.uploadFailed"));
            }

            const responseData = await res.json();

            if (status === "VALIDATED") {
                setSuccessMessage(t("studentCv.success.updated"));
            } else if (status === "REJECTED") {
                setSuccessMessage(t("studentCv.success.corrected"));
            } else {
                setSuccessMessage(t("studentCv.success.uploaded"));
            }

            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            if (onCvUpdated) {
                onCvUpdated(responseData);
            }
        } catch (err) {
            setErrorMessage(err.message || t("studentCv.errors.connection"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="flex flex-1 items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div
                className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-9">
                <span
                    className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">{t("studentCv.label")}</span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t("studentCv.title")}</h1>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{t("studentCv.description")}</p>

                {!isAccountEmailValidated && (
                    <p className="mt-6 rounded-xl border border-peach bg-peach/40 px-4 py-3 text-sm font-medium text-ink"
                       role="alert">
                        {t("studentCv.emailNotValidated")}
                    </p>
                )}

                {status === "REJECTED" && rejectionComment && (
                    <p className="mt-6 rounded-xl border border-blush bg-blush/40 px-4 py-3 text-sm text-ink"
                       role="status">
                        <strong>{t("studentCv.rejectionComment")}:</strong> {rejectionComment}
                    </p>
                )}

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
                            {t("studentCv.chooseFile")}
                        </label>
                        <p className="mt-2 text-sm text-ink-soft">{t("studentCv.dropFile")}</p>
                        <p className="mt-1 text-xs text-ink-soft">{t("studentCv.maximumSize")}</p>
                        {selectedFile &&
                            <p className="mt-4 rounded-xl bg-lavender/45 px-3 py-2 text-sm font-semibold text-ink"
                               role="status">{selectedFile.name}</p>}
                    </div>

                    {errorMessage && (
                        <p className="rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-medium text-error" role="alert">
                            {errorMessage}
                        </p>
                    )}
                    {successMessage && (
                        <p className="rounded-xl border border-lemon bg-lemon/45 px-4 py-3 text-sm font-medium text-ink" role="status">
                            {successMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!selectedFile || !isAccountEmailValidated || isSubmitting}
                        className="w-full rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? t("studentCv.submitting") : t("studentCv.submit")}
                    </button>
                </form>
            </div>
        </section>
    );
}
