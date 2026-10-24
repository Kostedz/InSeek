import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { countPendingDocuments } from "../../utils/gestionnaireCounts.js";

export default function ValidationTabs({ activeTab, offersCount, cvsCount }) {
    const { t } = useTranslation();
    const [loadedCounts, setLoadedCounts] = useState({ offers: null, cvs: null });

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
        { id: "dashboard", label: t("managerDashboard.tabs.home", "Accueil"), path: "/gestionnaire" },
        { id: "offers", label: t("managerValidation.tabs.offers", "Offres de stage"), path: "/gestionnaire/offres", count: displayedOffersCount },
        { id: "cvs", label: t("managerValidation.tabs.cvs", "CV des étudiants"), path: "/gestionnaire/cv", count: displayedCvsCount },
        { id: "students", label: t("managerStudents.tabLabel", "Étudiants"), path: "/gestionnaire/etudiants" },
        { id: "contracts", label: t("managerContracts.tabLabel", "Contrats"), path: "/gestionnaire/contrats" },
    ];

    return (
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-1.5 shadow-sm overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={`flex-1 min-w-[120px] rounded-xl px-3 py-2.5 text-center text-xs sm:text-sm font-bold transition-all ${
                            isActive
                                ? "bg-ink text-white shadow-sm"
                                : "text-ink-soft hover:bg-lavender/30 hover:text-ink"
                        }`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            {tab.label} {countBadge(tab.count)}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}