import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import Loading from "../../Loading.jsx";
import StudentApplicationDetails, {
    ApplicationStatusBadge,
} from "./StudentApplicationDetails.jsx";
import {
    formatDate,
    formatOfferTitle,
    normalizeApplication,
} from "../studentOfferUtils.js";

function sortByApplicationDate(applications) {
    return applications.sort((first, second) =>
        new Date(second.appliedAt ?? 0) - new Date(first.appliedAt ?? 0));
}

export default function EtudiantCandidatures() {
    const {t, i18n} = useTranslation();
    const language = i18n.resolvedLanguage === "en" ? "en" : "fr";
    const [applications, setApplications] = useState([]);
    const [offersCount, setOffersCount] = useState(null);
    const [cv, setCv] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        Promise.all([api.student.getApplications(), api.student.getCv()])
            .then(async ([applicationsResponse, cvResponse]) => {
                if (!applicationsResponse.ok) throw new Error("applications_load_failed");

                const applicationsData = await applicationsResponse.json();
                const cvData = cvResponse.ok && cvResponse.status !== 204
                    ? await cvResponse.json()
                    : null;
                const normalizedApplications =
                    (Array.isArray(applicationsData) ? applicationsData : []).map(normalizeApplication);

                if (!isMounted) return;

                setApplications(sortByApplicationDate(normalizedApplications));
                setCv(cvData);
                setLoading(false);

                loadAvailableOffersCount(normalizedApplications).then((count) => {
                    if (isMounted) setOffersCount(count);
                });
            })
            .catch(() => {
                if (!isMounted) return;
                setError(true);
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        onCountsChange?.({
            offersCount,
            applicationsCount: loading ? undefined : applications.length,
        });
    }, [onCountsChange, offersCount, loading, applications.length]);

    return (
        <>
            {loading && <Loading/>}

            {error && !loading && (
                    <div className="mt-8 rounded-2xl border border-error bg-blush/30 p-6" role="alert">
                        <p className="text-sm font-semibold text-error">{t("studentApplications.loadError")}</p>
                    </div>
                )}

            {!error && !loading && applications.length === 0 && (
                    <div
                        className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center shadow-[0_18px_50px_rgba(48,35,55,0.06)]">
                        <h2 className="text-xl font-black text-ink">{t("studentApplications.emptyTitle")}</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">{t("studentApplications.emptyDescription")}</p>
                    </div>
                )}

            {!error && !loading && applications.length > 0 && (
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        {applications.map((application) => {
                            const {offer} = application;
                            return (
                                <button
                                    type="button"
                                    key={application.id ?? offer.id}
                                    onClick={() => setSelectedApplication(application)}
                                    className="group flex h-full flex-col rounded-[1.5rem] border border-line bg-surface p-6 text-left shadow-[0_12px_35px_rgba(48,35,55,0.05)] transition-all hover:-translate-y-0.5 hover:border-lavender hover:shadow-[0_18px_45px_rgba(48,35,55,0.1)] focus:outline-none focus:ring-4 focus:ring-pink/50"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h2 className="truncate text-xl font-black tracking-tight text-ink">
                                                {formatOfferTitle(offer.title) || t("studentApplications.untitled")}
                                            </h2>
                                            {offer.company &&
                                                <p className="mt-1 text-sm font-bold text-ink-soft">{offer.company}</p>}
                                        </div>
                                        <ApplicationStatusBadge status={application.status} t={t}/>
                                    </div>
                                    <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-ink-soft">
                                        {offer.description || t("studentApplications.noDescription")}
                                    </p>
                                    <div
                                        className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs font-semibold text-ink-soft">
                                        <span>{t("studentApplications.appliedOn")} {formatDate(application.appliedAt, language) || t("studentApplications.notSpecified")}</span>
                                        <span
                                            className="inline-flex shrink-0 items-center whitespace-nowrap text-xs font-bold text-ink-soft transition-colors group-hover:text-ink sm:text-sm">
                                            {t("studentApplications.viewDetails")}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            {selectedApplication && (
                    application={selectedApplication}
                    cv={cv}
                    language={language}
                    onClose={() => setSelectedApplication(null)}
                />
            )}
        </>
    );
}
