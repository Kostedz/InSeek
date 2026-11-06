import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import useSlidingTabIndicator from "../../useSlidingTabIndicator.js";

export default function ProfessorTabs({activeTab, pendingCount}) {
    const {t} = useTranslation();
    const {navRef, tabRefs, indicator, indicatorClassName} = useSlidingTabIndicator(activeTab, "professor-active-tab");
    const tabs = [
        {id: "students", label: t("professorDashboard.tabs.students", "Mes étudiants"), path: "/professeur/etudiants"},
        {
            id: "evaluations",
            label: t("professorDashboard.tabs.evaluations", "Évaluations des milieux"),
            path: "/professeur/evaluations",
            count: pendingCount
        },
    ];

    return <nav ref={navRef} aria-label={t("professorDashboard.navigation", "Navigation du professeur")}
                className="relative mt-7 flex w-full flex-wrap gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit">
        <span aria-hidden="true" className={indicatorClassName} style={indicator ?? {opacity: 0}}/>
        {tabs.map(tab => <Link key={tab.id} to={tab.path} ref={node => {
            tabRefs.current[tab.id] = node;
        }}
                               className={`relative z-10 inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-colors sm:flex-none ${activeTab === tab.id ? "text-white" : "text-ink-soft hover:bg-lavender/30 hover:text-ink"}`}>
            <span>{tab.label}</span>{tab.count > 0 && <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">{tab.count}</span>}
        </Link>)}
    </nav>;
}
