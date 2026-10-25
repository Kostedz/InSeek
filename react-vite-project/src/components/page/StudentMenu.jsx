import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";
import {normalizeOffer} from "./studentOfferUtils.js";

function isPendingInterview(item) {
    const status = String(
        item?.interviewInvitationStatus ?? item?.statut ?? item?.status ?? ""
    ).toUpperCase();
    const dateValue = item?.DateAndTime ?? item?.dateAndTime ?? item?.dateInterview ?? item?.date;
    const date = dateValue ? new Date(dateValue) : null;

    return status === "PENDING"
        && date !== null
        && !Number.isNaN(date.getTime())
        && date.getTime() > Date.now();
}

export default function StudentMenu({user}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const [counts, setCounts] = useState({});
    const navRef = useRef(null);
    const tabRefs = useRef({});
    const hasMeasuredIndicator = useRef(false);
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [animateIndicator, setAnimateIndicator] = useState(false);
    const offersActive = pathname === "/" || pathname === "/etudiant/offres";
    const applicationsActive = pathname === "/etudiant/candidatures";
    const interviewsActive = pathname === "/etudiant/convocations";
    const contractActive = pathname === "/etudiant/contrat";
    const {offersCount, applicationsCount, interviewsCount} = counts;
    const activeTab = contractActive ? "contract" : interviewsActive ? "interviews" : applicationsActive ? "applications" : "offers";

    useLayoutEffect(() => {
        let animationTimer;

        const updateIndicator = (animate) => {
            const nav = navRef.current;
            const tab = tabRefs.current[activeTab];
            if (!nav || !tab) return;

            const navRect = nav.getBoundingClientRect();
            const tabRect = tab.getBoundingClientRect();
            setActiveIndicator({
                transform: `translate(${tabRect.left - navRect.left}px, ${tabRect.top - navRect.top}px)`,
                width: `${tabRect.width}px`,
                height: `${tabRect.height}px`,
            });

            const shouldAnimate = animate && hasMeasuredIndicator.current;
            hasMeasuredIndicator.current = true;
            setAnimateIndicator(shouldAnimate);

            if (shouldAnimate) {
                window.clearTimeout(animationTimer);
                animationTimer = window.setTimeout(() => setAnimateIndicator(false), 220);
            }
        };

        updateIndicator(true);
        const handleResize = () => updateIndicator(false);
        window.addEventListener("resize", handleResize);
        const resizeObserver = typeof ResizeObserver === "undefined"
            ? null
            : new ResizeObserver(handleResize);
        if (resizeObserver && navRef.current) resizeObserver.observe(navRef.current);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.clearTimeout(animationTimer);
            resizeObserver?.disconnect();
        };
    }, [activeTab]);

    useEffect(() => {
        let active = true;
        Promise.all([
            api.student.getOffers(),
            api.student.getAppliedOfferIds(),
            api.student.getConvocations(),
        ]).then(async ([offersResponse, applicationsResponse, interviewsResponse]) => {
            if (!offersResponse.ok || !applicationsResponse.ok || !interviewsResponse.ok) throw new Error("student_counts_load_failed");

            const [offersData, applicationsData, interviewsData] = await Promise.all([
                offersResponse.json(),
                applicationsResponse.json(),
                interviewsResponse.status === 204 ? Promise.resolve([]) : interviewsResponse.json(),
            ]);
            const appliedIds = new Set((Array.isArray(applicationsData) ? applicationsData : []).map(String));
            const interviews = Array.isArray(interviewsData) ? interviewsData : interviewsData.items ?? interviewsData.content ?? [];

            if (active) {
                setCounts({
                    offersCount: (Array.isArray(offersData) ? offersData : [])
                        .map(normalizeOffer)
                        .filter(({statut, id}) => statut === "VALIDE" && !appliedIds.has(String(id))).length,
                    applicationsCount: appliedIds.size,
                    interviewsCount: interviews.filter(isPendingInterview).length,
                });
            }
        }).catch(() => {
            if (active) setCounts({});
        });

        return () => {
            active = false;
        };
    }, [user?.id]);

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
                className={`pointer-events-none absolute left-0 top-0 z-0 rounded-xl bg-ink shadow-sm ${animateIndicator ? "transition-[transform,width,height] duration-200 ease-out" : ""}`}
                style={activeIndicator ?? {opacity: 0}}
            />
            <Link
                to="/etudiant/offres"
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
                    <span className={`h-2 w-2 rounded-full ${contractActive ? "bg-pink" : "bg-gold"}`}
                          aria-hidden="true"/>
                </span>
            </Link>
        </nav>
    );
}
