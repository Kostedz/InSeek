import React, {useState} from "react";
import api from "../../../../utils/api.js";
import {formatOfferTitle} from "../../offresUtils.js";

export default function ApplicationModal({offer, cv, t, onClose, onSubmitted}) {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const submitApplication = async () => {
        setSubmitting(true);
        setError("");

        try {
            const response = await api.student.applyToOffer(offer.id);

            if (response.status === 403) {
                setError(t("studentOffers.application.errors.cvRequired"));
                return;
            }
            if (response.status === 409) {
                setError(t("studentOffers.application.errors.alreadySubmitted"));
                return;
            }
            if (!response.ok) throw new Error("application_failed");

            setSubmitted(true);
            onSubmitted?.(offer.id);
        } catch {
            setError(t("studentOffers.application.errors.submitFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (!submitting && event.target === event.currentTarget) onClose();
            }}
        >
            <div
                className="w-full max-w-lg rounded-[2rem] border border-line bg-surface p-6 shadow-[0_24px_70px_rgba(48,35,55,0.25)] sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-application-title"
            >
                {submitted ? (
                    <div className="text-center">
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓
                        </div>
                        <h2 id="student-application-title" className="mt-5 text-2xl font-black text-ink">
                            {t("studentOffers.application.successTitle")}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-ink-soft">
                            {t("studentOffers.application.successDescription")}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft"
                        >
                            {t("studentOffers.application.close")}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span
                                    className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                                    {t("studentOffers.application.label")}
                                </span>
                                <h2 id="student-application-title"
                                    className="mt-4 text-2xl font-black tracking-tight text-ink">
                                    {t("studentOffers.application.title")}
                                </h2>
                                <p className="mt-2 text-sm font-semibold text-ink-soft">{formatOfferTitle(offer.title)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                aria-label={t("studentOffers.details.close")}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mt-6 rounded-2xl border border-line bg-canvas p-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                                {t("studentOffers.application.cvLabel")}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-bold text-ink">{cv?.fileName}</p>
                                    <p className="mt-1 text-sm text-ink-soft">{t("studentOffers.application.cvStatus")}</p>
                                </div>
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                    {t("studentCv.status.approved")}
                                </span>
                            </div>
                        </div>

                        <p className="mt-5 text-sm leading-6 text-ink-soft">
                            {t("studentOffers.application.description")}
                        </p>

                        {error && (
                            <p className="mt-5 rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-semibold text-error"
                               role="alert">
                                {error}
                            </p>
                        )}

                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-ink hover:bg-lavender/30 disabled:opacity-50"
                            >
                                {t("studentOffers.application.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={submitApplication}
                                disabled={submitting}
                                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting
                                    ? t("studentOffers.application.submitting")
                                    : t("studentOffers.application.submit")}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}