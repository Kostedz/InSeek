import {useLocation, Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import EmployeurOffres from "./EmployeurOffres.jsx";
import EmployerContractsPage from "./EmployerContractsPage.jsx";
import useSlidingTabIndicator from "../../useSlidingTabIndicator.js";

function EmployerMenu({activeTab, t, offersPath}) {
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
            <Link to="/employeur/contrats" ref={(node) => {
                tabRefs.current.contracts = node;
            }} className={itemClass(activeTab === "contracts")}>
                {t("navigation.employerContractsTab")}
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
    const activeTab = pathname === "/employeur/contrats" ? "contracts" : "offers";
    const offersPath = pathname === "/" ? "/" : "/employeur";

    return (
        <section className="flex flex-1 bg-canvas px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
                <header>
                    <span
                        className="inline-flex w-fit rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("employerHome.eyebrow")}
                    </span>
                    <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-ink sm:text-3xl">
                        {activeTab === "offers" ? t("employerOffers.title") : t("employerHome.contractsTitle")}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
                        {activeTab === "offers" ? t("employerOffers.description") : t("employerHome.contractsDescription")}
                    </p>
                </header>

                <EmployerMenu activeTab={activeTab} t={t} offersPath={offersPath}/>

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
                    ) : (
                        <EmployerContractsPage
                            user={user}
                            contracts={contracts}
                            embedded
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
