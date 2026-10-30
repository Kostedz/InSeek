import {useEffect, useState} from "react";
import {StatusBadge, getInterviewDate, FormatDate} from "./InterviewUtils.jsx";

function Info({label, value}) {
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

function isExpired(interview) {
    const date = getInterviewDate(interview);
    return date !== null && date.getTime() <= Date.now();
}

export default function InterviewDetails({
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
                    <StatusBadge status={interview.status} t={t}/>
                </div>

                {/* Details */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Info
                        label={t("studentInterviews.date")}
                        value={FormatDate(interview, language)}
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
                    <div className="sm:col-span-2">
                        <Info
                            label={t("studentInterviews.location")}
                            value={interview.location}
                        />
                    </div>
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
                                action === "ACCEPTED"
                                    ? "studentInterviews.confirmAccept"
                                    : "studentInterviews.confirmDecline"
                            )}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-ink-soft">
                            {t("studentInterviews.confirmDescription")}
                        </p>

                        {action === "REJECTED" && (
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