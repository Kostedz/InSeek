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
        <div className="flex flex-1" key={activeTab}>
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
    );
}
