import { StatusBadge, FormatDate } from "./InterviewUtils.jsx";

export default function InterviewList({interviews, view, onViewChange, onSelect, language, t, page = false}) {
    const visibleInterviews = interviews
        .filter((interview) =>
            view === "PENDING"
                ? interview.status === "PENDING"
                : ["ACCEPTED", "REJECTED", "EXPIRED"].includes(interview.status)
        )
        .sort((a, b) => b.id - a.id);

    const pendingCount = interviews.filter((interview) => interview.status === "PENDING").length;
    const historyCount = interviews.filter((interview) =>
        ["ACCEPTED", "REJECTED", "EXPIRED"].includes(interview.status)
    ).length;

    return (
        <div>
            <div
                className={`inline-flex max-w-full gap-1 rounded-2xl border border-line bg-surface p-1 shadow-[0_12px_30px_rgba(48,35,55,0.04)] ${
                    page ? "" : "bg-canvas shadow-none"
                }`}
                role="tablist"
            >
                <button
                    type="button"
                    role="tab"
                    onClick={() => onViewChange("PENDING")}
                    aria-selected={view === "PENDING"}
                    className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${
                        view === "PENDING"
                            ? "bg-ink text-white shadow-sm"
                            : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`}
                >
                    {t("studentInterviews.pending")}
                    <span className="ml-2 rounded-full bg-lavender/40 px-2 py-0.5 text-xs">
                        {pendingCount}
                    </span>
                </button>

                <button
                    type="button"
                    role="tab"
                    onClick={() => onViewChange("HISTORY")}
                    aria-selected={view === "HISTORY"}
                    className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-pink/40 ${
                        view === "HISTORY"
                            ? "bg-ink text-white shadow-sm"
                            : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`}
                >
                    {t("studentInterviews.history")}
                    <span className="ml-2 rounded-full bg-lavender/40 px-2 py-0.5 text-xs">
                        {historyCount}
                    </span>
                </button>
            </div>

            <div className={page ? "mt-5 grid gap-5 md:grid-cols-2" : "space-y-3 pt-5"}>
                {visibleInterviews.length === 0 ? (
                    <div
                        className={page
                            ? "rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_18px_50px_rgba(48,35,55,0.06)] md:col-span-2"
                            : "rounded-xl bg-canvas p-5 text-sm text-ink-soft"}
                    >
                        {page && <h2 className="text-xl font-black text-ink">
                            {view === "PENDING"
                                ? t("studentInterviews.noPending")
                                : t("studentInterviews.noHistory")}
                        </h2>}
                        {page && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                            {t("studentInterviews.emptyDescription")}
                        </p>}
                        {!page && (view === "PENDING"
                            ? t("studentInterviews.noPending")
                            : t("studentInterviews.noHistory"))}
                    </div>
                ) : (
                    visibleInterviews.map((interview) => (
                        <button
                            key={interview.id}
                            type="button"
                            onClick={() => onSelect(interview)}
                            className={page
                                ? "group flex h-full w-full flex-col rounded-[1.5rem] border border-line bg-surface p-6 text-left shadow-[0_12px_35px_rgba(48,35,55,0.05)] transition-all hover:-translate-y-0.5 hover:border-lavender hover:shadow-[0_18px_45px_rgba(48,35,55,0.1)] focus:outline-none focus:ring-4 focus:ring-pink/50"
                                : "flex w-full items-center gap-3 rounded-xl border border-line bg-canvas p-4 text-left transition-colors hover:border-lavender hover:bg-lavender/30 focus:outline-none focus:ring-4 focus:ring-pink/40"}
                        >
                            <div className="flex w-full min-w-0 flex-1 flex-col">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className={page
                                            ? "truncate text-xl font-black tracking-tight text-ink"
                                            : "font-bold text-ink"}
                                        >
                                            {interview.title || t("studentInterviews.untitled")}
                                        </p>
                                        {interview.company && (
                                            <p className="mt-1 text-sm font-bold text-ink-soft">{interview.company}</p>
                                        )}
                                    </div>
                                    {page && <StatusBadge status={interview.status} t={t}/>}
                                </div>

                                {page ? (
                                    <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-ink-soft">
                                        {interview.message || t("studentInterviews.cardDescription")}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-sm text-ink-soft">{FormatDate(interview, language)}</p>
                                )}

                                {!page && <div className="mt-3">
                                    <StatusBadge status={interview.status} t={t}/>
                                </div>}

                                {page && <div
                                    className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs font-semibold text-ink-soft">
                                    <span className="min-w-0 truncate">
                                        {FormatDate(interview, language)}
                                        {interview.mode && ` · ${t(`studentInterviews.modes.${interview.mode}`, {
                                            defaultValue: interview.mode,
                                        })}`}
                                    </span>
                                    <span
                                        className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-ink-soft transition-colors group-hover:text-ink">
                                        {t("studentApplications.viewDetails")}
                                    </span>
                                </div>}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}