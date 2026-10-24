import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../utils/api.js";

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

export default function StudentMenu({offersCount, applicationsCount, interviewsCount, onCountsChange}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const [loadedInterviewsCount, setLoadedInterviewsCount] = useState();
    const navRef = useRef(null);
    const tabRefs = useRef({});
    const hasMeasuredIndicator = useRef(false);
    const [activeIndicator, setActiveIndicator] = useState(null);
    const [animateIndicator, setAnimateIndicator] = useState(false);
    const offersActive = pathname === "/" || pathname === "/etudiant/offres";
    const applicationsActive = pathname === "/etudiant/candidatures";
    const interviewsActive = pathname === "/etudiant/convocations";
    const contractActive = pathname === "/etudiant/contrat";
    const displayedInterviewsCount = interviewsCount ?? loadedInterviewsCount;
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
        if (interviewsCount !== undefined || interviewsActive) return undefined;

        let active = true;
        api.student.getConvocations()
            .then(async (response) => {
                if (!response.ok) throw new Error("interviews_load_failed");
                const data = response.status === 204 ? [] : await response.json();
                const interviews = Array.isArray(data) ? data : data.items ?? data.content ?? [];
                if (active) {
                    const pendingCount = interviews.filter(isPendingInterview).length;
                    setLoadedInterviewsCount(pendingCount);
                    onCountsChange?.({interviewsCount: pendingCount});
                }
            })
            .catch(() => {
                // Hide the optional badge when the notification count cannot be loaded.
                setLoadedInterviewsCount(null);
            });

        return () => {
            active = false;
        };
    }, [interviewsActive, interviewsCount, onCountsChange]);

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
                    {countBadge(displayedInterviewsCount)}
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
