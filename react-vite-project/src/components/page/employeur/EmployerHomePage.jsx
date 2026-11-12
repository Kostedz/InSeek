import {useCallback, useEffect, useState} from "react";
import {useLocation, Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {STUDENT_TAB_COUNTS_CHANGED_EVENT} from "../../../utils/tabCounts.js";
import EmployeurOffres from "./EmployeurOffres.jsx";
import EmployerContractsPage from "./EmployerContractsPage.jsx";
import EmployerEvaluationsPage, {EMPLOYER_EVALUATIONS_UPDATED_EVENT} from "./EmployerEvaluationsPage.jsx";
import useSlidingTabIndicator from "../../useSlidingTabIndicator.js";

function EmployerMenu({activeTab, t, offersPath, contractsCount, evaluationsCount}) {
    const {navRef, tabRefs, indicator, indicatorClassName} = useSlidingTabIndicator(activeTab, "employer-active-tab");
    const itemClass = (active) => [
        "relative z-10 inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200 sm:flex-none",
        active ? "text-white" : "text-ink-soft hover:bg-lavender/30 hover:text-ink",
    ].join(" ");

    return (
        <nav
            aria-label={t("navigation.employerMenuAriaLabel")}
            ref={navRef}
            className="relative mt-7 flex w-full flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit"
        >
            <span aria-hidden="true" className={indicatorClassName} style={indicator ?? {opacity: 0}}/>
            <Link to={offersPath} ref={(node) => {
                tabRefs.current.offers = node;
            }} className={itemClass(activeTab === "offers")}>
                {t("navigation.employerOffersTab")}
            </Link>
            <Link to="/employeur/evaluations" ref={(node) => {
                tabRefs.current.evaluations = node;
            }} className={itemClass(activeTab === "evaluations")}>
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.employerEvaluationsTab", "Évaluations")}
                    {evaluationsCount > 0 && <span
                        aria-label={t("employerEvaluation.pendingCount", "{{count}} stagiaire(s) à évaluer", {count: evaluationsCount})}
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">{evaluationsCount}</span>}
                </span>
            </Link>
            <Link to="/employeur/contrats" ref={(node) => {
                tabRefs.current.contracts = node;
            }} className={itemClass(activeTab === "contracts")}>
                <span className="flex items-center justify-center gap-2">
                    {t("navigation.employerContractsTab")}
                    {contractsCount > 0 && (
                        <span
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
                            {contractsCount}
                        </span>
                    )}
                </span>
            </Link>
        </nav>
    );
}

export default function EmployerHomePage({
                                             user,
                                             contracts,
                                             canManageOffers,
                                             companyName,
                                             isAccountEmailValidated,
                                             drafts,
                                             setDrafts,
                                         }) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const [contractsCount, setContractsCount] = useState(null);
    const [evaluationsCount, setEvaluationsCount] = useState(0);
    const activeTab = pathname === "/employeur/contrats" ? "contracts" : pathname === "/employeur/evaluations" ? "evaluations" : "offers";
    const offersPath = pathname === "/" ? "/" : "/employeur";

    const refreshContractsCount = useCallback(async () => {
        try {
            const response = await api.employer.getContracts();
            if (!response.ok) throw new Error("employer_contract_count_failed");
            const payload = await response.json();
            const contracts = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? payload.contracts ?? [];
            setContractsCount(contracts.filter((contract) =>
                String(contract?.contractStatus ?? contract?.status ?? "").toUpperCase() === "SIGNED_BY_STUDENT"
            ).length);
            let submitted = {};
            try {
                submitted = JSON.parse(localStorage.getItem("inseek.employer.internship-evaluation.submitted") || "{}");
            } catch {
                submitted = {};
            }
            setEvaluationsCount(contracts.filter((contract) =>
                ["EXECUTED", "FULLY_SIGNED", "COMPLETED"].includes(String(contract?.contractStatus ?? contract?.status ?? "").toUpperCase())
                && !submitted[String(contract?.id ?? contract?.contractId)]
            ).length);
        } catch {
            setContractsCount(null);
        }
    }, [user?.id]);

    useEffect(() => {
        refreshContractsCount();
        window.addEventListener(STUDENT_TAB_COUNTS_CHANGED_EVENT, refreshContractsCount);
        window.addEventListener(EMPLOYER_EVALUATIONS_UPDATED_EVENT, refreshContractsCount);
        window.addEventListener("focus", refreshContractsCount);
        return () => {
            window.removeEventListener(STUDENT_TAB_COUNTS_CHANGED_EVENT, refreshContractsCount);
            window.removeEventListener(EMPLOYER_EVALUATIONS_UPDATED_EVENT, refreshContractsCount);
            window.removeEventListener("focus", refreshContractsCount);
        };
    }, [refreshContractsCount]);

    return (
        <section className="flex flex-1 bg-canvas px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <header>
                    <span
                        className="inline-flex w-fit rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("employerHome.eyebrow")}
                    </span>
                    <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-ink sm:text-3xl">
                        {activeTab === "offers" ? t("employerOffers.title") : activeTab === "contracts" ? t("employerHome.contractsTitle") : t("employerEvaluation.title", "Évaluation des stagiaires")}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
                        {activeTab === "offers" ? t("employerOffers.description") : activeTab === "contracts" ? t("employerHome.contractsDescription") : t("employerEvaluation.description", "Évaluez les stagiaires embauchés dans votre entreprise.")}
                    </p>
                </header>

                <EmployerMenu activeTab={activeTab} t={t} offersPath={offersPath} contractsCount={contractsCount}
                              evaluationsCount={evaluationsCount}/>

                <div className="mt-6">
                    {activeTab === "offers" ? (
                        <EmployeurOffres
                            user={user}
                            canManageOffers={canManageOffers}
                            companyName={companyName}
                            isAccountEmailValidated={isAccountEmailValidated}
                            drafts={drafts}
                            setDrafts={setDrafts}
                            embedded
                        />
                    ) : activeTab === "contracts" ? (
                        <EmployerContractsPage
                            user={user}
                            contracts={contracts}
                            embedded
                        />
                    ) : <EmployerEvaluationsPage/>}
                </div>
            </div>
        </section>
    );
}
