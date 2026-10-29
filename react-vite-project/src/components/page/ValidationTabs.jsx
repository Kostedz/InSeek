import { useEffect, useState } from "react";
import {Link, useLocation} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { countPendingDocuments } from "../../utils/gestionnaireCounts.js";
import useSlidingTabIndicator from "../useSlidingTabIndicator.js";

export default function ValidationTabs({ activeTab, offersCount, cvsCount }) {
    const { t } = useTranslation();
    const {pathname} = useLocation();
    const homePath = pathname.startsWith("/gestionnaire") ? "/gestionnaire" : "/";
    const [loadedCounts, setLoadedCounts] = useState({ offers: null, cvs: null });
    const {navRef, tabRefs, indicator, indicatorClassName} = useSlidingTabIndicator(activeTab, "manager-active-tab");

    useEffect(() => {
        let isMounted = true;
        const requests = [];

        if (offersCount === undefined) {
            requests.push(countPendingDocuments("OffreDeStage").then((count) => ["offers", count]));
        }
        if (cvsCount === undefined) {
            requests.push(countPendingDocuments("CV").then((count) => ["cvs", count]));
        }

        if (!requests.length) return () => { isMounted = false; };

        Promise.all(requests).then((results) => {
            if (!isMounted) return;
            setLoadedCounts((current) => ({
                ...current,
                ...Object.fromEntries(results.filter(([, count]) => count !== null)),
            }));
        }).catch(() => {});

        return () => { isMounted = false; };
    }, [offersCount, cvsCount]);

    const displayedOffersCount = offersCount ?? loadedCounts.offers;
    const displayedCvsCount = cvsCount ?? loadedCounts.cvs;

    const countBadge = (count) => count === null || count === undefined || count === 0 ? null : (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
            {count}
        </span>
    );

    const tabs = [
        {id: "home", label: t("managerDashboard.tabs.home", "Tableau de bord"), path: homePath},
        {
            id: "offers",
            label: t("managerValidation.tabs.offers", "Offres à valider"),
            path: "/gestionnaire/offres",
            count: displayedOffersCount
        },
        { id: "cvs", label: t("managerValidation.tabs.cvs", "CV des étudiants"), path: "/gestionnaire/cv", count: displayedCvsCount },
        {
            id: "students",
            label: t("managerStudents.tabLabel", "Étudiants admissibles"),
            path: "/gestionnaire/etudiants"
        },
        {id: "contracts", label: t("managerContracts.tabLabel", "Suivi des contrats"), path: "/gestionnaire/contrats"},
    ];

    return (
        <nav
            ref={navRef}
            aria-label={t("navigation.managerMenuAriaLabel", "Navigation du gestionnaire")}
            className="relative mt-7 flex w-full flex-wrap gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit"
        >
            <span aria-hidden="true" className={indicatorClassName} style={indicator ?? {opacity: 0}}/>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        ref={(node) => {
                            tabRefs.current[tab.id] = node;
                        }}
                        className={`relative z-10 inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-colors sm:flex-none ${isActive ? "text-white" : "text-ink-soft hover:bg-lavender/30 hover:text-ink"}`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            {tab.label} {countBadge(tab.count)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
