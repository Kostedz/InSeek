import {useLocation, Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import EmployeurOffres from "./EmployeurOffres.jsx";
import EmployerContractsPage from "./EmployerContractsPage.jsx";

function EmployerMenu({activeTab, t}) {
    const itemClass = (active) => [
        "inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:flex-none",
        active ? "bg-ink text-white shadow-sm" : "text-ink-soft hover:bg-lavender/30 hover:text-ink",
    ].join(" ");

    return (
        <nav
            aria-label={t("navigation.employerMenuAriaLabel")}
            className="mt-7 flex w-full flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit"
        >
            <Link to="/" className={itemClass(activeTab === "offers")}>
                {t("navigation.employerOffersTab")}
            </Link>
            <Link to="/employeur/contrats" className={itemClass(activeTab === "contracts")}>
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

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <span
                    className="flex w-fit rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                    {t("employerHome.eyebrow")}
                </span>
                <div key={activeTab}>
                    {activeTab === "offers" ? (
                        <EmployeurOffres
                            user={user}
                            canManageOffers={canManageOffers}
                            companyName={companyName}
                            isAccountEmailValidated={isAccountEmailValidated}
                            drafts={drafts}
                            setDrafts={setDrafts}
                            workspaceTabs={<EmployerMenu activeTab={activeTab} t={t}/>}
                        />
                    ) : (
                        <EmployerContractsPage
                            user={user}
                            contracts={contracts}
                            workspaceTabs={<EmployerMenu activeTab={activeTab} t={t}/>}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
