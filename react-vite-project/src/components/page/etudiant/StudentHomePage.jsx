import {useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import EtudiantAccueil from "./EtudiantAccueil.jsx";
import EtudiantCandidatures from "./EtudiantCandidatures.jsx";
import StudentConvocation from "./StudentConvocation.jsx";
import StudentMenu from "./StudentMenu.jsx";
import ContractSignaturePage, {
    createDemoContract,
    getDemoContracts,
    isDemoStudent,
    saveDemoContract
} from "../ContractSignaturePage.jsx";
import StudentCvAccess from "./StudentCvAccess.jsx";

function getActiveTab(pathname) {
    if (pathname === "/etudiant/candidatures") return "applications";
    if (pathname === "/etudiant/convocations") return "interviews";
    if (pathname === "/etudiant/contrat") return "contract";
    return "offers";
}

export default function StudentHomePage({user, contract}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const activeTab = getActiveTab(pathname);
    const displayedContract = contract ?? (isDemoStudent(user)
        ? getDemoContracts().find((item) => item.contractId === "demo-camille-nexora-1") ?? createDemoContract()
        : undefined);
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
        contract: {
            title: t("studentContract.title", "Mon contrat de stage"),
            description: t("studentContract.description", "Consultez les modalités de votre stage et signez votre entente électroniquement."),
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

                <StudentCvAccess user={user}>
                    {({cv}) => (
                        <>
                            <StudentMenu user={user}/>

                            <div key={activeTab}>
                                {activeTab === "offers" && (
                                    <EtudiantAccueil user={user} cvData={cv}/>
                                )}
                                {activeTab === "applications" && (
                                    <EtudiantCandidatures/>
                                )}
                                {activeTab === "interviews" && (
                                    <StudentConvocation user={user} page/>
                                )}
                                {activeTab === "contract" && (
                                    <ContractSignaturePage
                                        user={user}
                                        contract={displayedContract}
                                        onSigned={(signedContract) => {
                                            if (displayedContract?.contractId === "demo-camille-nexora-1") {
                                                saveDemoContract({
                                                    ...displayedContract,
                                                    ...signedContract,
                                                    contractStatus: "STUDENT_SIGNED",
                                                    studentSigned: true,
                                                    studentSignedAt: new Date().toISOString(),
                                                });
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </StudentCvAccess>
            </div>
        </section>
    );
}
