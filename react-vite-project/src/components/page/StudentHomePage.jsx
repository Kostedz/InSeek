import {useCallback, useState} from "react";
import {useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import EtudiantAccueil from "./EtudiantAccueil.jsx";
import EtudiantCandidatures from "./EtudiantCandidatures.jsx";
import EtudiantConvocations from "./EtudiantConvocations.jsx";
import StudentMenu from "./StudentMenu.jsx";

function getActiveTab(pathname) {
    if (pathname === "/etudiant/candidatures") return "applications";
    if (pathname === "/etudiant/convocations") return "interviews";
    return "offers";
}

export default function StudentHomePage({user}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const activeTab = getActiveTab(pathname);
    const [counts, setCounts] = useState({});
    const updateCounts = useCallback((nextCounts) => {
        setCounts((currentCounts) => Object.entries(nextCounts).reduce(
            (updatedCounts, [name, value]) => value === undefined || value === null
                ? updatedCounts
                : {...updatedCounts, [name]: value},
            currentCounts,
        ));
    }, []);

    const pageCopy = {
        offers: {
            title: t("studentOffers.title"),
            description: t("studentOffers.description"),
        },
        applications: {
            title: t("studentApplications.title"),
            description: t("studentApplications.description"),
        },
        interviews: {
            title: t("studentInterviews.title"),
            description: t("studentInterviews.allDescription"),
        },
    }[activeTab];

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <header>
                    <span
                        className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                        {t("studentOffers.studentArea")}
                    </span>
                    <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                        {pageCopy.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                        {pageCopy.description}
                    </p>
                </header>

                <StudentMenu
                    offersCount={counts.offersCount}
                    applicationsCount={counts.applicationsCount}
                    interviewsCount={counts.interviewsCount}
                    onCountsChange={updateCounts}
                />

                <div key={activeTab}>
                    {activeTab === "offers" && (
                        <EtudiantAccueil user={user} onCountsChange={updateCounts}/>
                    )}
                    {activeTab === "applications" && (
                        <EtudiantCandidatures onCountsChange={updateCounts}/>
                    )}
                    {activeTab === "interviews" && (
                        <EtudiantConvocations user={user} onCountsChange={updateCounts}/>
                    )}
                </div>
            </div>
        </section>
    );
}
