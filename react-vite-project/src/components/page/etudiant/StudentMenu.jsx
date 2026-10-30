import {useEffect, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {normalizeOffer} from "../../componentUtils/offresUtils.js";
import {getInterviewDate, normalizeInterview} from "../../componentUtils/etudiant/convocationsUtils/InterviewUtils.jsx";
import {STUDENT_TAB_COUNTS_CHANGED_EVENT} from "../../../utils/tabCounts.js";
import useSlidingTabIndicator from "../../useSlidingTabIndicator.js";

function isPendingInterview(item) {
    const interview = normalizeInterview(item);
    const date = getInterviewDate(interview);

    return interview.status === "PENDING" && date !== null && date.getTime() > Date.now();
}

export default function StudentMenu({user}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const [counts, setCounts] = useState({});
    const [refreshVersion, setRefreshVersion] = useState(0);
    const offersActive = pathname === "/" || pathname === "/etudiant/offres";
    const applicationsActive = pathname === "/etudiant/candidatures";
    const interviewsActive = pathname === "/etudiant/convocations";
    const contractActive = pathname === "/etudiant/contrat";
    const {offersCount, applicationsCount, interviewsCount, contractsCount} = counts;
    const activeTab = contractActive ? "contract" : interviewsActive ? "interviews" : applicationsActive ? "applications" : "offers";

    const {navRef, tabRefs, indicator, indicatorClassName} = useSlidingTabIndicator(activeTab, "student-active-tab");
    const offersPath = offersActive && pathname === "/" ? "/" : "/etudiant/offres";

    useEffect(() => {
        const refreshCounts = () => setRefreshVersion((version) => version + 1);
        window.addEventListener(STUDENT_TAB_COUNTS_CHANGED_EVENT, refreshCounts);
        return () => window.removeEventListener(STUDENT_TAB_COUNTS_CHANGED_EVENT, refreshCounts);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([
            api.student.getOffers(),
            api.student.getAppliedOfferIds(),
            api.student.getConvocations(),
            api.student.getContracts(),
        ]).then(async ([offersResponse, applicationsResponse, interviewsResponse, contractsResponse]) => {
            if (!offersResponse.ok || !applicationsResponse.ok || !interviewsResponse.ok || !contractsResponse.ok) throw new Error("student_counts_load_failed");

            const [offersData, applicationsData, interviewsData, contractsData] = await Promise.all([
                offersResponse.json(),
                applicationsResponse.json(),
                interviewsResponse.status === 204 ? Promise.resolve([]) : interviewsResponse.json(),
                contractsResponse.status === 204 ? Promise.resolve([]) : contractsResponse.json(),
            ]);
            const appliedIds = new Set((Array.isArray(applicationsData) ? applicationsData : []).map(String));
            const interviews = Array.isArray(interviewsData) ? interviewsData : interviewsData.items ?? interviewsData.content ?? [];
            const contracts = Array.isArray(contractsData) ? contractsData : contractsData.items ?? contractsData.content ?? [];

            if (active) {
                setCounts({
                    offersCount: (Array.isArray(offersData) ? offersData : [])
                        .map(normalizeOffer)
                        .filter(({statut, id}) => statut === "VALIDE" && !appliedIds.has(String(id))).length,
                    applicationsCount: appliedIds.size,
                    interviewsCount: interviews.filter(isPendingInterview).length,
                    contractsCount: contracts.filter((contract) =>
                        String(contract?.contractStatus ?? contract?.status ?? "").toUpperCase() === "PENDING_SIGNATURE"
                    ).length,
                });
            }
        }).catch(() => {
            if (active) setCounts({});
        });

        return () => {
            active = false;
        };
    }, [user?.id, pathname, refreshVersion]);

    const countBadge = (count) => count === null || count === undefined ? null : (
        <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
            {count}
        </span>
    );

    const itemClass = (active) => [
        "relative z-10 inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200 sm:flex-none",
        active
            ? "text-white"
            : "text-ink-soft hover:bg-lavender/30 hover:text-ink",
    ].join(" ");

    return (
        <nav
            aria-label={t("navigation.studentMenuAriaLabel")}
            ref={navRef}
            className="relative mt-7 flex w-full flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit"
        >
            <span
                aria-hidden="true"
                className={indicatorClassName}
                style={indicator ?? {opacity: 0}}
            />
            <Link
                to={offersPath}
                ref={(node) => {
                    tabRefs.current.offers = node;
                }}
                className={itemClass(offersActive)}
            >
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.offers")}
                    {countBadge(offersCount)}
                </span>
            </Link>
            <Link
                to="/etudiant/candidatures"
                ref={(node) => {
                    tabRefs.current.applications = node;
                }}
                className={itemClass(applicationsActive)}
            >
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.applications")}
                    {countBadge(applicationsCount)}
                </span>
            </Link>
            <Link
                to="/etudiant/convocations"
                ref={(node) => {
                    tabRefs.current.interviews = node;
                }}
                className={itemClass(interviewsActive)}
            >
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.interviews")}
                    {countBadge(interviewsCount)}
                </span>
            </Link>
            <Link
                to="/etudiant/contrat"
                ref={(node) => {
                    tabRefs.current.contract = node;
                }}
                className={itemClass(contractActive)}
            >
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.contract", "Contrat")}
                    {countBadge(contractsCount)}
                </span>
            </Link>
        </nav>
    );
}
