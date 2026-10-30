import React, {useEffect, useState} from "react";
import {formatDate, formatDateRange, formatOfferTitle, formatSalary} from "../../offresUtils.js";
import PdfPreview from "../../../PdfPreview.jsx";
import ApplicationModal from "./ApplicationModal.jsx";

export default function OfferDetails({offer, language, t, onClose, studentCv, alreadyApplied, onApplicationSubmitted}) {
    const [applicationOpen, setApplicationOpen] = useState(false);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
                role="presentation"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <article
                    aria-labelledby="student-offer-details-title"
                    aria-modal="true"
                    className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_70px_rgba(48,35,55,0.25)] sm:rounded-[2rem]"
                    role="dialog"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-9">
                        <div className="flex items-start justify-between gap-5">
                            <div>
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                            {t("studentOffers.details.label")}
                        </span>
                                <h2 id="student-offer-details-title"
                                    className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                                    {formatOfferTitle(offer.title) || t("studentOffers.untitled")}
                                </h2>
                                {offer.company &&
                                    <p className="mt-2 text-base font-bold text-ink-soft">{offer.company}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={t("studentOffers.details.close")}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                            >
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M6 6l12 12M18 6 6 18"/>
                                </svg>
                            </button>
                        </div>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-line bg-canvas p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.publishedOn")}</p>
                                <p className="mt-1 text-sm font-semibold text-ink">{formatDate(offer.publicationDate, language) || t("studentOffers.details.notSpecified")}</p>
                            </div>
                            <div className="rounded-2xl border border-line bg-canvas p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.internshipPeriod")}</p>
                                <p className="mt-1 text-sm font-semibold text-ink">{formatDateRange(offer.startDate, offer.endDate, language, t, "studentOffers.details")}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                            <h3 className="text-base font-black text-ink">{t("studentOffers.details.description")}</h3>
                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-soft">
                                {offer.description || t("studentOffers.details.notSpecified")}
                            </p>
                        </div>

                        <PdfPreview
                            documentId={offer.id}
                            fileName={offer.fileName}
                            className="mt-6"
                        />

                        <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                            {offer.address && <div><p
                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.location")}</p>
                                <p className="mt-1 text-sm text-ink">{offer.address}</p></div>}
                            <div><p
                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.salary")}</p>
                                <p className="mt-1 text-sm text-ink">{formatSalary(offer.salary, language, t, "studentOffers.details.unpaid")}</p>
                            </div>
                            {offer.contactName && <div><p
                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.contact")}</p>
                                <p className="mt-1 text-sm text-ink">{offer.contactName}</p></div>}
                            {offer.contactPhone && <div><p
                                className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentOffers.details.phone")}</p>
                                <p className="mt-1 text-sm text-ink">{offer.contactPhone}</p></div>}
                        </div>

                        <div
                            className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-ink-soft">
                                {alreadyApplied
                                    ? t("studentOffers.application.alreadySubmitted")
                                    : t("studentOffers.application.prompt")}
                            </p>
                            <button
                                type="button"
                                disabled={alreadyApplied}
                                onClick={() => setApplicationOpen(true)}
                                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-green-100 disabled:text-green-800"
                            >
                                {alreadyApplied
                                    ? t("studentOffers.application.alreadySubmittedButton")
                                    : t("studentOffers.application.apply")}
                            </button>
                        </div>
                    </div>
                </article>
            </div>
            {applicationOpen && (
                <ApplicationModal
                    offer={offer}
                    cv={studentCv}
                    t={t}
                    onClose={() => setApplicationOpen(false)}
                    onSubmitted={onApplicationSubmitted}
                />
            )}
        </>
    );
}