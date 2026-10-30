import {useTranslation} from "react-i18next";
import React, {useState} from "react";
import {getApplicationStatus} from "./offresGetterUtils.js";
import api from "../../../../utils/api.js";
import {translateMessage} from "../../../../utils/i18nMessage.js";

import {ApplicationDocument} from "./ApplicationOffresComponents.jsx";
import Icon from "./Icon.jsx";
import {initials} from "./employeurOffresUtils.js";

export default function ApplicationDetails({
                                               application,
                                               language,
                                               isInterviewScheduled,
                                               onBack,
                                               onClose,
                                               onScheduleInterview,
                                               onRefresh,
                                               onDecision
                                           }) {
    const {t} = useTranslation();
    const hasContactDetails = application.email || application.phone || application.address;

    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionType, setDecisionType] = useState(null); // 'ACCEPTED' | 'REJECTED'
    const [rejectionComment, setRejectionComment] = useState("");
    const [commentError, setCommentError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [decidedStatus, setDecidedStatus] = useState(null);
    const [decidedComment, setDecidedComment] = useState("");

    // Le statut local (décision qui vient d'être prise) a priorité sur celui de la candidature
    const currentStatus = decidedStatus ?? getApplicationStatus(application);
    const isPending = currentStatus === "PENDING";
    const isAccepted = currentStatus === "ACCEPTED";
    const isRejected = currentStatus === "REJECTED";
    const shownRejectionComment = decidedComment || application.rejectionComment || application.commentaireRefus || "";

    const handleOpenDecisionModal = (type) => {
        setDecisionType(type);
        setRejectionComment("");
        setCommentError("");
        setServerError(null);
        setShowDecisionModal(true);
    };

    const handleSubmitDecision = async () => {
        setServerError(null);

        if (decisionType === "REJECTED" && !rejectionComment.trim()) {
            setCommentError(t("employerOffers.applications.errors.commentRequired", "Un commentaire expliquant le refus est obligatoire."));
            return;
        }

        setIsSubmitting(true);

        try {
            let response;
            if (decisionType === "ACCEPTED") {
                response = await api.employer.applications.accept(application.id);
            } else {
                response = await api.employer.applications.reject(application.id, rejectionComment);
            }

            if (!response.ok) {
                const raw = await response.text().catch(() => "");
                let message = raw;
                try {
                    const parsed = JSON.parse(raw);
                    message = parsed.messageKey || parsed.message || "";
                } catch {
                }
                console.error("Decision failed", response.status, raw);
                throw new Error(message || "employerOffers.applications.errors.decisionFailed");
            }

            setShowDecisionModal(false);
            setDecidedStatus(decisionType);
            setDecidedComment(decisionType === "REJECTED" ? rejectionComment : "");
            setSuccessMessage(
                decisionType === "ACCEPTED"
                    ? t("employerOffers.applications.success.accepted", "Candidature acceptée avec succès.")
                    : t("employerOffers.applications.success.rejected", "Candidature refusée avec succès.")
            );

            if (onDecision) onDecision(application.id, decisionType, decisionType === "REJECTED" ? rejectionComment : "");
            if (onRefresh) onRefresh();
        } catch (err) {
            setServerError({key: err.message});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="application-detail-title">
                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <button type="button" onClick={onBack}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                    aria-label={t("employerOffers.applications.backToList")}>
                                <Icon name="back" className="h-5 w-5"/>
                            </button>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">{t("employerOffers.applications.detailLabel")}</p>
                                <h2 id="application-detail-title"
                                    className="mt-1 truncate text-xl font-black tracking-tight text-ink sm:text-2xl">{application.name}</h2>
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink hover:bg-lavender/30 hover:text-ink focus:outline-none focus:ring-4 focus:ring-pink/40"
                                aria-label={t("employerOffers.applications.close")}>
                            <Icon name="close" className="h-5 w-5"/>
                        </button>
                    </div>

                    {successMessage && (
                        <div
                            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                            {successMessage}
                        </div>
                    )}

                    <div
                        className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-canvas p-4">
                        <span
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink/55 text-lg font-black text-ink">{initials(application.name || t("employerOffers.applications.unknownStudent"))}</span>
                        <div className="min-w-0">
                            <p className="font-black text-ink">{application.name || t("employerOffers.applications.unknownStudent")}</p>
                            <p className="mt-1 break-all text-sm text-ink-soft">{application.email || t("employerOffers.applications.notSpecified")}</p>
                        </div>

                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                            {isPending && (
                                <span
                                    className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                                    {t("employerOffers.applications.status.pending", "En attente")}
                                </span>
                            )}
                            {isAccepted && (
                                <span
                                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                                    {t("employerOffers.applications.status.accepted", "Acceptée")}
                                </span>
                            )}
                            {isRejected && (
                                <span
                                    className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                                    {t("employerOffers.applications.status.rejected", "Refusée")}
                                </span>
                            )}
                            {isInterviewScheduled && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full border border-lavender bg-lavender/35 px-3 py-1 text-xs font-bold text-ink">
                                    <Icon name="calendar" className="h-3.5 w-3.5"/>
                                    {t("employerOffers.interviews.alreadyScheduled", "Entrevue déjà planifiée")}
                                </span>
                            )}
                        </div>
                    </div>

                    {isRejected && shownRejectionComment && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                                {t("employerOffers.applications.rejectionReason", "Raison du refus")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {shownRejectionComment}
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
                        <section className="rounded-2xl border border-line bg-surface p-4">
                            <h3 className="text-sm font-black text-ink">{t("employerOffers.applications.contactDetails")}</h3>
                            {hasContactDetails ? <div className="mt-4 space-y-3">
                                    {application.email && <a href={`mailto:${application.email}`}
                                                             className="flex items-start gap-3 text-sm text-ink-soft transition-colors hover:text-ink"><Icon
                                        name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span
                                        className="break-all">{application.email}</span></a>}
                                    {application.phone && <a href={`tel:${application.phone}`}
                                                             className="flex items-start gap-3 text-sm text-ink-soft transition-colors hover:text-ink"><Icon
                                        name="phone"
                                        className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span>{application.phone}</span></a>}
                                    {application.address &&
                                        <p className="flex items-start gap-3 text-sm text-ink-soft"><Icon name="info"
                                                                                                          className="mt-0.5 h-4 w-4 shrink-0 text-ink"/><span>{application.address}</span>
                                        </p>}
                                </div> :
                                <p className="mt-3 text-sm text-ink-soft">{t("employerOffers.applications.notSpecified")}</p>}
                        </section>
                    </div>

                    <section className="mt-5">
                        <h3 className="text-sm font-black text-ink">{t("employerOffers.applications.documentsTitle")}</h3>
                        <div className="mt-3">
                            <ApplicationDocument icon="file" label={t("employerOffers.applications.cv")}
                                                 fileName={application.cvFileName} documentId={application.cvDocumentId}
                                                 t={t}/>
                        </div>
                    </section>

                    <div className="mt-8 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
                                    {t("employerOffers.applications.actionsTitle")}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-ink-soft">
                                    {isInterviewScheduled
                                        ? t("employerOffers.interviews.alreadyScheduledDescription", "Une entrevue est déjà planifiée pour cet étudiant.")
                                        : isPending
                                            ? t("employerOffers.applications.actionsDescription")
                                            : t("employerOffers.applications.readOnlyNotice", "Décision déjà enregistrée.")}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            {isPending && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenDecisionModal("REJECTED")}
                                    className="rounded-xl border border-error bg-white px-4 py-2 text-sm font-bold text-error hover:bg-[#fff0f3] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t("employerOffers.applications.reject", "Refuser")}
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={!isPending || isInterviewScheduled}
                                title={isInterviewScheduled
                                    ? t("employerOffers.interviews.alreadyScheduledDescription", "Une entrevue est déjà planifiée pour cet étudiant.")
                                    : !isPending
                                        ? t("employerOffers.interviews.disabledAfterDecision", "Une décision a déjà été prise pour cette candidature.")
                                        : undefined}
                                onClick={() => {
                                    if (!isPending || isInterviewScheduled) return;
                                    onScheduleInterview({
                                        ...application,
                                        id: application.studentId,
                                    });
                                }}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    isInterviewScheduled || !isPending
                                        ? "bg-line text-ink-soft"
                                        : "bg-ink text-white hover:bg-ink-soft"
                                }`}
                            >
                                <Icon name="calendar" className="h-4 w-4"/>
                                {isInterviewScheduled
                                    ? t("employerOffers.interviews.alreadyScheduled", "Entrevue déjà planifiée")
                                    : t("employerOffers.interviews.title", "Planifier une entrevue")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmation / Saisie du motif de refus */}
            {showDecisionModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-black text-ink">
                            {decisionType === "ACCEPTED"
                                ? t("employerOffers.applications.confirmAcceptTitle", "Accepter la candidature")
                                : t("employerOffers.applications.confirmRejectTitle", "Refuser la candidature")}
                        </h3>

                        <p className="text-sm text-ink-soft">
                            {decisionType === "ACCEPTED"
                                ? t("employerOffers.applications.confirmAcceptDesc", "Souhaitez-vous vraiment accepter cette candidature ? L'étudiant sera notifié.")
                                : t("employerOffers.applications.confirmRejectDesc", "Veuillez expliquer les raisons du refus. Ce commentaire sera transmis à l'étudiant.")}
                        </p>

                        {serverError && (
                            <div
                                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                                {translateMessage(t, serverError)}
                            </div>
                        )}

                        {decisionType === "REJECTED" && (
                            <div>
                                <label className="block text-xs font-bold text-ink mb-1">
                                    {t("employerOffers.applications.commentLabel", "Raison du refus *")}
                                </label>
                                <textarea
                                    rows="3"
                                    value={rejectionComment}
                                    onChange={(e) => {
                                        setRejectionComment(e.target.value);
                                        if (commentError) setCommentError("");
                                    }}
                                    placeholder={t("employerOffers.applications.commentPlaceholder", "Saisissez les raisons du refus...")}
                                    className="w-full rounded-xl border border-line bg-canvas p-3 text-sm text-ink outline-none focus:border-lavender resize-none"
                                />
                                {commentError &&
                                    <p className="mt-1 text-xs font-semibold text-rose-600">{commentError}</p>}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-line">
                            <button
                                type="button"
                                onClick={() => setShowDecisionModal(false)}
                                className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-canvas"
                            >
                                {t("common.cancel", "Annuler")}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleSubmitDecision}
                                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors ${
                                    decisionType === "ACCEPTED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                } disabled:opacity-50`}
                            >
                                {isSubmitting ? t("common.saving", "Traitement...") : t("common.confirm", "Confirmer")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}