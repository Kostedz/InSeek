import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {notifyStudentTabCountsChanged} from "../../../utils/tabCounts.js";

import InterviewList from "./convocationsUtils/InterviewList.jsx";
import InterviewDetails from "./convocationsUtils/InterviewDetails.jsx";
import {normalizeInterview, getInterviewDate, StatusBadge, FormatDate} from "./convocationsUtils/InterviewUtils.jsx";

export default function StudentInterviews({user, page = false, onPendingCountChange}) {
    const {t, i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";

    const [interviews, setInterviews] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [convocationView, setConvocationView] = useState("PENDING");

    const loadInterviews = useCallback(async (isActive = () => true) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.student.getConvocations();

            if (!response.ok) throw new Error("load");

            const data = response.status === 204 ? [] : await response.json();
            const items = Array.isArray(data)
                ? data
                : data.items ?? data.content ?? [];

            if (isActive()) {
                setInterviews(
                    items
                        .filter((item) => item && item.id != null)
                        .map(normalizeInterview)
                );
            }
        } catch (loadError) {
            if (import.meta.env.DEV) {
                console.debug("Student convocations could not be loaded.", loadError);
            }
            if (isActive()) {
                setInterviews([]);
                setError(t("studentInterviews.loadError"));
            }
        } finally {
            if (isActive()) setLoading(false);
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
        loadInterviews(() => active);
        return () => {
            active = false;
        };
    }, [loadInterviews, user]);

    const respond = async (interview, responseType, comment = "") => {
        setSaving(true);
        setError(null);

        try {
            const response = await api.student.respondToConvocation(interview.id, {
                interviewInvitationStatus: responseType,
                messageWhenRejected:
                    responseType === "REJECTED" ? comment.trim() || null : null,
            });

            if (response && typeof response.json === "function") {
                if (!response.ok) {
                    const responseError = new Error("respond");
                    responseError.status = response.status;
                    throw responseError;
                }
                notifyStudentTabCountsChanged();

                if (response.status !== 204) {
                    const updated = await response.json();
                    if (updated?.id != null) {
                        const updatedInterview = normalizeInterview(updated);
                        setInterviews((previous) =>
                            previous.map((item) =>
                                item.id === updatedInterview.id ? updatedInterview : item
                            )
                        );
                        setSelected(updatedInterview);
                        return;
                    }
                }

                await loadInterviews();
                setSelected(null);
                return;
            }

            if (response && response.id != null) {
                notifyStudentTabCountsChanged();
                const updatedInterview = normalizeInterview(response);

                setInterviews((previous) =>
                    previous.map((item) =>
                        item.id === updatedInterview.id ? updatedInterview : item
                    )
                );

                setSelected(updatedInterview);
            }

            if (!response?.id) {
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

    useEffect(() => {
        onPendingCountChange?.(pendingInterviews.length);
    }, [onPendingCountChange, pendingInterviews.length]);

    const openInterview = (interview) => {
        setError(null);
        setSelected(interview);
    };

    if (page) {
        return (
            <>
                {loading ? (
                    <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-sm text-ink-soft shadow-[0_12px_30px_rgba(48,35,55,0.04)]">
                        {t("studentInterviews.loading")}
                    </p>
                ) : error ? (
                    <p className="mt-8 rounded-2xl border border-error bg-blush/30 p-6 text-sm font-semibold text-error"
                       role="alert">
                        {error}
                    </p>
                ) : (
                    <div className="mt-8">
                        <InterviewList
                            interviews={interviews}
                            view={convocationView}
                            onViewChange={setConvocationView}
                            onSelect={openInterview}
                            language={language}
                            t={t}
                            page
                        />
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
                                {t("studentInterviews.cardDescription")}
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
                                {FormatDate(nextInterview, language)}
                            </p>

                            <div className="mt-3">
                                <StatusBadge status={nextInterview.status} t={t}/>
                            </div>
                        </div>

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

                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                            <InterviewList
                                interviews={interviews}
                                view={convocationView}
                                onViewChange={setConvocationView}
                                onSelect={(interview) => {
                                    setShowAll(false);
                                    openInterview(interview);
                                }}
                                language={language}
                                t={t}
                            />
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
