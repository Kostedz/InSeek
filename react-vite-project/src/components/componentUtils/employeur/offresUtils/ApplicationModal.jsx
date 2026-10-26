import {useTranslation} from "react-i18next";
import React, {useEffect, useState} from "react";
import ApplicationDetails from "./ApplicationDetails.jsx";
import {formatOfferTitle} from "../../offresUtils.js";
import Icon from "./Icon.jsx";
import Loading from "../../../Loading.jsx";
import {getApplicationStatus} from "./offresGetterUtils.js";
import {formatDate} from "./employeurOffresUtils.js";
import {ApplicationStatusBadge} from "./ApplicationOffresComponents.jsx";
import {initials} from "./employeurOffresUtils.js";

export default function ApplicationModal({offer, applications, language, onClose, isLoading, error, onScheduleInterview, scheduledInterviews, onRefresh, onDecision}) {
    const {t} = useTranslation();
    const [selectedApplication, setSelectedApplication] = useState(null);

    // Garde la candidature sélectionnée synchronisée avec la liste rafraîchie
    const currentApplication = selectedApplication
        ? applications.find((application) => application.id === selectedApplication.id) ?? selectedApplication
        : null;

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                if (selectedApplication) setSelectedApplication(null);
                else onClose();
            }
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose, selectedApplication]);

    if (currentApplication) {
        return (
            <ApplicationDetails
                application={currentApplication}
                language={language}
                isInterviewScheduled={
                    Boolean(currentApplication.interviewScheduled)
                    || Boolean(scheduledInterviews[`${offer.id}_${currentApplication.studentId}`])
                }
                onBack={() => setSelectedApplication(null)}
                onClose={onClose}
                onScheduleInterview={onScheduleInterview}
                onRefresh={onRefresh}
                onDecision={onDecision}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="applications-title">
                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.applications.label")}</p>
                                <span
                                    className="rounded-full bg-pink/55 px-2.5 py-1 text-xs font-black text-ink">{applications.length}</span>
                            </div>
                            <h2 id="applications-title"
                                className="mt-2 text-2xl font-black tracking-tight text-ink">{t("employerOffers.applications.title")}</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">{formatOfferTitle(offer.position) || t("employerOffers.untitledOffer")}</p>
                        </div>
                        <button type="button" onClick={onClose}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                aria-label={t("employerOffers.applications.close")}>
                            <Icon name="close" className="h-5 w-5"/>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="mt-6 rounded-2xl border border-line bg-canvas px-5 py-12 text-center">
                            <Loading/>
                        </div>
                    ) : error ? (
                        <div className="mt-6 rounded-2xl border border-error bg-blush/30 px-5 py-12 text-center">
                            <p className="text-base font-black text-error">{t("employerOffers.errors.loadFailed")}</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div
                            className="mt-6 rounded-2xl border border-dashed border-line bg-canvas px-5 py-12 text-center">
                            <p className="text-base font-black text-ink">{t("employerOffers.applications.emptyTitle")}</p>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">{t("employerOffers.applications.emptyDescription")}</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                            {applications.map((application) => {
                                const applicationHasInterview = Boolean(application.interviewScheduled)
                                    || Boolean(scheduledInterviews[`${offer.id}_${application.studentId}`]);

                                return <button key={application.id} type="button"
                                               onClick={() => setSelectedApplication(application)}
                                               className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-canvas p-4 text-left transition-colors hover:border-lavender hover:bg-lavender/15 focus:outline-none focus:ring-4 focus:ring-pink/40">
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink/55 text-sm font-black text-ink">{initials(application.name || t("employerOffers.applications.unknownStudent"))}</span>
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className="block truncate text-sm font-black text-ink">{application.name || t("employerOffers.applications.unknownStudent")}</span>
                                        <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-soft"><Icon
                                            name="mail"
                                            className="h-3.5 w-3.5 shrink-0"/>{application.email || t("employerOffers.applications.notSpecified")}</span>
                                        <span
                                            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft sm:hidden"><Icon
                                            name="calendar"
                                            className="h-3.5 w-3.5 shrink-0"/>{formatDate(application.submittedAt, language) || t("employerOffers.applications.notSpecified")}</span>
                                    </span>
                                    <span
                                        className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-soft sm:flex"><Icon
                                        name="calendar"
                                        className="h-3.5 w-3.5"/>{formatDate(application.submittedAt, language) || t("employerOffers.applications.notSpecified")}</span>
                                    <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                        <ApplicationStatusBadge status={getApplicationStatus(application)}/>
                                        {applicationHasInterview && (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full border border-lavender bg-lavender/35 px-3 py-1 text-xs font-bold text-ink">
                                                <Icon name="calendar" className="h-3.5 w-3.5"/>
                                                {t("employerOffers.interviews.alreadyScheduled", "Entrevue déjà planifiée")}
                                            </span>
                                        )}
                                    </span>
                                    <Icon name="chevron"
                                          className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"/>
                                </button>;
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}