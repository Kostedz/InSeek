
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../utils/api.js";
import validationTabs from "../page/ValidationTabs.jsx";

function normalizeStatus(value) {
    const normalized = String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    if (["ACCEPTEE", "ACCEPTED"].includes(normalized)) {
        return "ACCEPTED";
    }

    if (["REFUSEE", "REJECTED", "DECLINED"].includes(normalized)) {
        return "REJECTED";
    }

    if (["EXPIRED", "EXPIREE"].includes(normalized)) {
        return "EXPIRED";
    }

    return "PENDING";
}
function normalizeInterview(item) {
    const date =
        item.DateAndTime ??
        item.dateAndTime ??
        item.dateInterview ??
        item.date;

    const status = normalizeStatus(
        item.interviewInvitationStatus ??
        item.statut ??
        item.status
    );

    const expiredByDate =
        date != null &&
        !Number.isNaN(new Date(date).getTime()) &&
        new Date(date).getTime() <= Date.now();

    return {
        ...item,
        id: item.id,
        title: item.position ?? item.jobTitle ?? item.title ?? "",
        company: item.nomEntreprise ?? item.companyName ?? item.company ?? "",
        date,
        time: item.heureEntrevue ?? item.interviewTime ?? item.time,
        duration: item.duree ?? item.duration,
        mode: item.mode ?? item.modeInterview,
        location: item.locationOrLink ?? item.lieu ?? item.location ?? "",
        meetingLink: item.lienVisio ?? item.meetingLink ?? "",
        message: item.message ?? item.messageEmployeur ?? "",
        status: status === "PENDING" && expiredByDate
            ? "EXPIRED"
            : status,
        responseComment:
            item.messageWhenRejected ?? item.commentaireEtudiant ?? null,
        responseDate:
            item.invitationResponseDate ?? item.dateReponse ?? null,
    };
}

function getInterviewDate(interview) {
    if (!interview.date) return null;

    const date = new Date(interview.date);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isExpired(interview) {
    const date = getInterviewDate(interview);
    return date !== null && date.getTime() <= Date.now();
}

function formatDate(interview, language) {
    const date = getInterviewDate(interview);
    if (!date) return null;

    return new Intl.DateTimeFormat(
        language === "en" ? "en-CA" : "fr-CA",
        { dateStyle: "long", timeStyle: "short" }
    ).format(date);
}

function StatusBadge({ status, t }) {
    const styles = {
        PENDING: "border-gold bg-gold/45 text-ink",
        ACCEPTED: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJECTED: "border-[#eab0bf] bg-[#fff0f3] text-error",
        EXPIRED: "border-[#ccc] bg-[#f5f5f5] text-ink-soft",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1
                text-xs font-bold ${styles[status] ?? styles.PENDING}`}
        >
            {t(`studentInterviews.status.${status}`)}
        </span>
    );
}

function Info({ label, value }) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return null;
    }

    return (
        <div className="rounded-xl border border-line bg-canvas p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {label}
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-ink">
                {value}
            </p>
        </div>
    );
}


function InterviewDetails({
                              interview,
                              language,
                              t,
                              onClose,
                              onRespond,
                              saving,
                              error,
                          }) {
    const [action, setAction] = useState(null);
    const [comment, setComment] = useState("");
    const expired = isExpired(interview);
    const alreadyResponded = interview.status !== "PENDING";
    const canRespond = !expired && !alreadyResponded;

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !saving) onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose, saving]);

    const confirmResponse = async () => {
        if (!canRespond || !action || saving) return;

        await onRespond(
            interview,
            action,
            action === "REJECTED" ? comment.trim() : ""
        );
        setAction(null);
    };

    const inputClass = `w-full rounded-xl border border-line bg-canvas
        px-4 py-3 text-sm text-ink outline-none transition
        focus:border-lavender focus:ring-4 focus:ring-pink/40
        disabled:cursor-not-allowed disabled:opacity-50`;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center
            overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-interview-title"
                className="w-full max-w-lg rounded-2xl border border-line
                    bg-surface p-6 shadow-xl sm:p-8"
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-4
                    border-b border-line pb-4">
                    <h2
                        id="student-interview-title"
                        className="text-xl font-black text-ink"
                    >
                        {interview.title || t("studentInterviews.untitled")}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label={t("studentInterviews.close")}
                        className="shrink-0 text-lg font-bold text-ink-soft
                            transition-colors hover:text-ink
                            disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                {/* Company and status */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {interview.company && (
                        <p className="text-sm text-ink-soft">
                            {interview.company}
                        </p>
                    )}
                    <StatusBadge status={interview.status} t={t} />
                </div>

                {/* Details */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Info
                        label={t("studentInterviews.date")}
                        value={formatDate(interview, language)}
                    />
                    <Info
                        label={t("studentInterviews.duration")}
                        value={interview.duration
                            ? t("studentInterviews.durationValue", {
                                duration: interview.duration,
                            })
                            : null}
                    />
                    <Info
                        label={t("studentInterviews.mode")}
                        value={interview.mode
                            ? t(`studentInterviews.modes.${interview.mode}`, {
                                defaultValue: interview.mode,
                            })
                            : null}
                    />
                    <Info
                        label={t("studentInterviews.location")}
                        value={interview.location}
                    />
                </div>

                {interview.meetingLink && (
                    <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex rounded-xl border
                            border-line px-5 py-2.5 text-sm font-bold
                            text-ink transition-colors hover:bg-canvas
                            focus:outline-none focus:ring-4
                            focus:ring-pink/40"
                    >
                        {t("studentInterviews.meetingLink")}
                    </a>
                )}

                {/* Employer message */}
                {interview.message && (
                    <div className="mt-5 rounded-xl border border-line
                        bg-canvas p-4">
                        <h3 className="text-sm font-bold text-ink">
                            {t("studentInterviews.employerMessage")}
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm
                            leading-6 text-ink-soft">
                            {interview.message}
                        </p>
                    </div>
                )}

                {/* Existing response */}
                {alreadyResponded && (
                    <div className="mt-5 rounded-xl border border-line
                        bg-canvas p-4">
                        <h3 className="text-sm font-bold text-ink">
                            {t("studentInterviews.responseRecorded")}
                        </h3>

                        {interview.responseDate && (
                            <p className="mt-1 text-sm text-ink-soft">
                                {t("studentInterviews.responseDate", {
                                    date: new Intl.DateTimeFormat(
                                        language === "en" ? "en-CA" : "fr-CA",
                                        {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        }
                                    ).format(new Date(interview.responseDate)),
                                })}
                            </p>
                        )}

                        {interview.responseComment && (
                            <p className="mt-2 whitespace-pre-line text-sm
                                text-ink-soft">
                                <span className="font-bold text-ink">
                                    {t("studentInterviews.yourComment")}:
                                </span>{" "}
                                {interview.responseComment}
                            </p>
                        )}
                    </div>
                )}

                {expired && !alreadyResponded && (
                    <div role="status" className="mt-4 rounded-xl border
                        border-[#eab0bf] bg-[#fff0f3] p-3 text-sm
                        font-semibold text-error">
                        {t("studentInterviews.expired")}
                    </div>
                )}

                {error && (
                    <div role="alert" className="mt-4 rounded-xl border
                        border-error bg-blush/30 p-3 text-sm
                        font-semibold text-error">
                        {error}
                    </div>
                )}

                {canRespond && !action && (
                    <div className="mt-5 flex flex-col gap-3 border-t
                        border-line pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => setAction("REJECTED")}
                            className="rounded-xl border border-line px-5
                                py-2.5 text-sm font-bold text-ink
                                transition-colors hover:bg-canvas
                                disabled:opacity-50"
                        >
                            {t("studentInterviews.decline")}
                        </button>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => setAction("ACCEPTED")}
                            className="rounded-xl bg-ink px-5 py-2.5
                                text-sm font-bold text-white
                                transition-colors hover:bg-ink-soft
                                disabled:opacity-50"
                        >
                            {t("studentInterviews.accept")}
                        </button>
                    </div>
                )}

                {/* Confirmation */}
                {canRespond && action && (
                    <div className="mt-5 border-t border-line pt-4">
                        <h3 className="text-base font-black text-ink">
                            {t(
                                action === "ACCEPTEE"
                                    ? "studentInterviews.confirmAccept"
                                    : "studentInterviews.confirmDecline"
                            )}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-ink-soft">
                            {t("studentInterviews.confirmDescription")}
                        </p>

                        {action === "REFUSEE" && (
                            <div className="mt-4">
                                <label
                                    htmlFor="decline-comment"
                                    className="mb-1 block text-sm font-bold
                                        text-ink"
                                >
                                    {t("studentInterviews.optionalComment")}
                                </label>
                                <textarea
                                    id="decline-comment"
                                    rows={3}
                                    value={comment}
                                    disabled={saving}
                                    onChange={(event) =>
                                        setComment(event.target.value)
                                    }
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        )}

                        <div className="mt-5 flex flex-col-reverse gap-3
                            border-t border-line pt-4 sm:flex-row
                            sm:justify-end">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setAction(null)}
                                className="rounded-xl border border-line
                                    px-5 py-2.5 text-sm font-bold text-ink
                                    transition-colors hover:bg-canvas
                                    disabled:opacity-50"
                            >
                                {t("studentInterviews.cancel", "Annuler")}
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={confirmResponse}
                                className="rounded-xl bg-ink px-5 py-2.5
                                    text-sm font-bold text-white
                                    transition-colors hover:bg-ink-soft
                                    disabled:opacity-50"
                            >
                                {saving
                                    ? t("studentInterviews.saving")
                                    : t("studentInterviews.confirm")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StudentInterviews({ user }) {
    const {t, i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";

    const [interviews, setInterviews] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [convocationView, setConvocationView] = useState("PENDING");

    const loadInterviews = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.student.getConvocations();

            if (!response.ok) throw new Error("load");

            const data = response.status === 204 ? [] : await response.json();
            const items = Array.isArray(data)
                ? data
                : data.items ?? data.content ?? [];

            setInterviews(items.map(normalizeInterview));
        } catch {
            setError(t("studentInterviews.loadError"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (!showAll && !selected) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showAll, selected]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.student.getConvocations();

                if (!response.ok) throw new Error("load");

                const data = response.status === 204 ? [] : await response.json();
                const items = Array.isArray(data)
                    ? data
                    : data.items ?? data.content ?? [];

                if (active) {
                    setInterviews(
                        items
                            .filter((item) => item && item.id != null)
                            .map(normalizeInterview)
                    );
                }
            } catch {
                if (active) setError(t("studentInterviews.loadError"));
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [user, t]);

    const respond = async (interview, responseType, comment = "") => {
        setSaving(true);
        setError(null);

        try {
            const updated = await api.student.respondToConvocation(interview.id, {
                interviewInvitationStatus: responseType,
                messageWhenRejected:
                    responseType === "REJECTED" ? comment.trim() || null : null,
            });

            if (updated && updated.id != null) {
                const updatedInterview = normalizeInterview(updated);

                setInterviews((previous) =>
                    previous.map((item) =>
                        item.id === updatedInterview.id ? updatedInterview : item
                    )
                );

                setSelected(updatedInterview);
            } else {
                await loadInterviews();
                setSelected(null);
            }
        } catch (err) {
            setError(t("studentInterviews.submitError"));

            if (err?.status === 409 || err?.status === 400) {
                await loadInterviews();
            }
        } finally {
            setSaving(false);
        }
    };
    const pendingInterviews = interviews
        .filter((interview) => {
            const date = getInterviewDate(interview);

            return (
                interview.status === "PENDING" &&
                date !== null &&
                date.getTime() > Date.now()
            );
        })
        .sort((a, b) => b.id - a.id);

    const nextInterview = pendingInterviews[0] ?? null;

    const visibleInterviews = interviews
        .filter((interview) =>
            convocationView === "PENDING"
                ? interview.status === "PENDING"
                : ["ACCEPTED", "REJECTED", "EXPIRED"].includes(interview.status)
        )
        .sort((a, b) => b.id - a.id);


    return (
        <>
            <section
                className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-[0_12px_30px_rgba(48,35,55,0.06)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender/40 text-ink">
                            <svg
                                aria-hidden="true"
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect x="3" y="5" width="18" height="16" rx="2"/>
                                <path d="M16 3v4M8 3v4M3 10h18"/>
                                <path d="m9 15 2 2 4-4"/>
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-ink">
                                {t("studentInterviews.title")}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-ink-soft">
                                {pendingInterviews.length > 0
                                    ? t("studentInterviews.pendingCount", {
                                        count: pendingInterviews.length,
                                    })
                                    : t("studentInterviews.cardDescription")}
                            </p>
                        </div>
                    </div>

                    <span
                        className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-1 text-[13px] font-black leading-none text-ink"
                        aria-label={t("studentInterviews.pendingCount", {
                            count: pendingInterviews.length,
                        })}
                    >
                    {pendingInterviews.length}
                </span>
                </div>

                {loading ? (
                    <p className="mt-5 rounded-xl bg-canvas p-4 text-sm text-ink-soft">
                        {t("studentInterviews.loading")}
                    </p>
                ) : error ? (
                    <p
                        className="mt-5 rounded-xl border border-error bg-blush/30 p-4 text-sm text-error"
                        role="alert"
                    >
                        {error}
                    </p>
                ) : nextInterview ? (
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            setSelected(nextInterview);
                        }}
                        className="mt-5 flex w-full items-center gap-3 rounded-xl border border-line bg-canvas p-4 text-left transition-colors hover:border-lavender hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-ink">
                                {nextInterview.title ||
                                    t("studentInterviews.untitled")}
                            </p>

                            {nextInterview.company && (
                                <p className="mt-1 text-sm text-ink-soft">
                                    {nextInterview.company}
                                </p>
                            )}

                            <p className="mt-2 text-sm text-ink-soft">
                                {formatDate(nextInterview, language)}
                            </p>

                            <div className="mt-3">
                                <StatusBadge status={nextInterview.status} t={t}/>
                            </div>
                        </div>

                        <svg
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 text-ink-soft"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                ) : (
                    <p className="mt-5 rounded-xl bg-canvas p-4 text-sm text-ink-soft">
                        {t("studentInterviews.noPending")}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => {
                        setConvocationView("PENDING");
                        setShowAll(true);
                    }}
                    disabled={loading || Boolean(error)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-pink/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    {t("studentInterviews.viewAll")}

                    <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M5 12h14m-6-6 6 6-6 6"/>
                    </svg>
                </button>
            </section>

            {showAll && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowAll(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="student-interviews-list-title"
                        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_70px_rgba(48,35,55,0.25)] sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
                            <div>
                                <h2
                                    id="student-interviews-list-title"
                                    className="text-xl font-black text-ink sm:text-2xl"
                                >
                                    {t("studentInterviews.title")}
                                </h2>

                                <p className="mt-1 text-sm text-ink-soft">
                                    {t("studentInterviews.allDescription")}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAll(false)}
                                aria-label={t("studentInterviews.close")}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40"
                            >
                            <span aria-hidden="true" className="text-xl">
                                ×
                            </span>
                            </button>
                        </div>

                        {/* Pending / History switch */}
                        <div className="flex gap-2 border-b border-line px-5 pt-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setConvocationView("PENDING")}
                                aria-pressed={convocationView === "PENDING"}
                                className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${
                                    convocationView === "PENDING"
                                        ? "border-ink text-ink"
                                        : "border-transparent text-ink-soft hover:text-ink"
                                }`}
                            >
                                {t("studentInterviews.pending")}
                                <span className="ml-2 rounded-full bg-lavender/40 px-2 py-0.5 text-xs">
                                {interviews.filter(
                                    (interview) =>
                                        interview.status === "PENDING"
                                ).length}
                            </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setConvocationView("HISTORY")}
                                aria-pressed={convocationView === "HISTORY"}
                                className={`rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${
                                    convocationView === "HISTORY"
                                        ? "border-ink text-ink"
                                        : "border-transparent text-ink-soft hover:text-ink"
                                }`}
                            >
                                {t("studentInterviews.history")}
                                <span className="ml-2 rounded-full bg-lavender/40 px-2 py-0.5 text-xs">
                                {interviews.filter((interview) =>
                                    ["ACCEPTED", "REJECTED", "EXPIRED"].includes(interview.status)
                                ).length}
                            </span>
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
                            {visibleInterviews.length === 0 ? (
                                <p className="rounded-xl bg-canvas p-5 text-sm text-ink-soft">
                                    {convocationView === "PENDING"
                                        ? t("studentInterviews.noPending")
                                        : t("studentInterviews.noHistory")}
                                </p>
                            ) : (
                                visibleInterviews.map((interview) => (
                                    <button
                                        key={interview.id}
                                        type="button"
                                        onClick={() => {
                                            setShowAll(false);
                                            setError(null);
                                            setSelected(interview);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl border border-line bg-canvas p-4 text-left transition-colors hover:border-lavender hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-ink">
                                                {interview.title ||
                                                    t("studentInterviews.untitled")}
                                            </p>

                                            {interview.company && (
                                                <p className="mt-1 text-sm text-ink-soft">
                                                    {interview.company}
                                                </p>
                                            )}

                                            <p className="mt-2 text-sm text-ink-soft">
                                                {formatDate(interview, language)}
                                            </p>

                                            <div className="mt-3">
                                                <StatusBadge
                                                    status={interview.status}
                                                    t={t}
                                                />
                                            </div>
                                        </div>

                                        <svg
                                            aria-hidden="true"
                                            className="h-5 w-5 shrink-0 text-ink-soft"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="m9 18 6-6-6-6"/>
                                        </svg>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {selected && (
                <InterviewDetails
                    interview={selected}
                    language={language}
                    t={t}
                    onClose={() => setSelected(null)}
                    onRespond={respond}
                    saving={saving}
                    error={error}
                />
            )}
        </>
    );
}

