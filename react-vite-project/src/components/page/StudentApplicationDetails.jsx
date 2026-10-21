import {useEffect} from "react";
import {useTranslation} from "react-i18next";
import PdfPreview from "../PdfPreview.jsx";
import {
    formatDate,
    formatDateRange,
    formatDiscipline,
    formatOfferTitle,
    formatSalary,
} from "./studentOfferUtils.js";

const STATUS_STYLES = {
    SOUMISE: "border-lavender bg-lavender/35 text-ink",
    EN_COURS_D_EXAMEN: "border-gold/50 bg-gold/20 text-ink",
    ACCEPTEE: "border-green-200 bg-green-100 text-green-800",
    REFUSEE: "border-error/30 bg-blush/30 text-error",
};

export function ApplicationStatusBadge({status, t}) {
    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[status] ?? STATUS_STYLES.SOUMISE}`}>
            {t(`studentApplications.status.${status}`)}
        </span>
    );
}

export default function StudentApplicationDetails({application, cv, language, onClose}) {
    const {t} = useTranslation();
    const {offer} = application;

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(48,35,55,0.3)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-application-detail-title"
            >
                <div className="overflow-y-auto p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
                                {t("studentApplications.detailLabel")}
                            </p>
                            <h2 id="student-application-detail-title"
                                className="mt-2 truncate text-2xl font-black tracking-tight text-ink">
                                {formatOfferTitle(offer.title) || t("studentApplications.untitled")}
                            </h2>
                            {offer.company && <p className="mt-1 text-sm font-bold text-ink-soft">{offer.company}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t("studentApplications.close")}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft hover:border-ink hover:bg-lavender/30 hover:text-ink"
                        >
                            ×
                        </button>
                    </div>

                    <div
                        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.currentStatus")}</p>
                            <div className="mt-2"><ApplicationStatusBadge status={application.status} t={t}/></div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.appliedOn")}</p>
                            <p className="mt-1 text-sm font-semibold text-ink">
                                {formatDate(application.appliedAt, language) || t("studentApplications.notSpecified")}
                            </p>
                        </div>
                    </div>

                    <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
                        <h3 className="text-base font-black text-ink">{t("studentApplications.offerSummary")}</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.internshipPeriod")}</p>
                                <p className="mt-1 text-sm text-ink">{formatDateRange(offer.startDate, offer.endDate, language, t, "studentApplications")}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.salary")}</p>
                                <p className="mt-1 text-sm text-ink">{formatSalary(offer.salary, language, t, "studentApplications.unpaid")}</p>
                            </div>
                            {offer.address && <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.location")}</p>
                                <p className="mt-1 text-sm text-ink">{offer.address}</p>
                            </div>}
                            {offer.discipline && <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentApplications.discipline")}</p>
                                <p className="mt-1 text-sm text-ink">{formatDiscipline(offer.discipline, t)}</p>
                            </div>}
                        </div>
                        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-soft">
                            {offer.description || t("studentApplications.noDescription")}
                        </p>
                        <PdfPreview documentId={offer.id} fileName={offer.fileName} className="mt-5"/>
                    </section>

                    <section className="mt-5 rounded-2xl border border-line bg-surface p-5">
                        <h3 className="text-base font-black text-ink">{t("studentApplications.submittedFile")}</h3>
                        <p className="mt-2 text-sm text-ink-soft">{t("studentApplications.submittedFileDescription")}</p>
                        {cv ? (
                            <>
                                <div
                                    className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-ink">{cv.fileName || t("studentApplications.notSpecified")}</p>
                                        <p className="mt-1 text-xs text-ink-soft">{t("studentApplications.validatedCv")}</p>
                                    </div>
                                    <span
                                        className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                        {t("studentApplications.cvValidated")}
                                    </span>
                                </div>
                                <PdfPreview documentId={cv.id} fileName={cv.fileName} className="mt-4"/>
                            </>
                        ) : (
                            <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">{t("studentApplications.cvUnavailable")}</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
