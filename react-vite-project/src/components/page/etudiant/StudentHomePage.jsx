import {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import EtudiantAccueil from "./EtudiantAccueil.jsx";
import EtudiantCandidatures from "./EtudiantCandidatures.jsx";
import StudentConvocation from "./StudentConvocation.jsx";
import StudentMenu from "./StudentMenu.jsx";
import StudentContractsPage from "./StudentContractsPage.jsx";
import StudentCvAccess from "./StudentCvAccess.jsx";

function getActiveTab(pathname) {
    if (pathname === "/etudiant/candidatures") return "applications";
    if (pathname === "/etudiant/convocations") return "interviews";
    if (pathname === "/etudiant/contrat") return "contract";
    return "offers";
}

export default function StudentHomePage({user}) {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const activeTab = getActiveTab(pathname);
    const [loadedContract, setLoadedContract] = useState(contract ?? null);
    const [contractLoading, setContractLoading] = useState(false);

    useEffect(() => {
        setLoadedContract(contract ?? null);
        if (contract || activeTab !== "contract") return undefined;

        let isMounted = true;
        setContractLoading(true);
        api.student.getContract()
            .then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    if (isMounted) setLoadedContract(data);
                } else if (response.status === 404 && isDemoStudent(user)) {
                    const demoContract = getDemoContracts().find((item) => item.contractId === "demo-camille-nexora-1")
                        ?? createDemoContract();
                    if (isMounted) setLoadedContract(demoContract);
                } else if (isMounted) {
                    setLoadedContract(null);
                }
            })
            .catch(() => {
                if (isMounted) setLoadedContract(null);
            })
            .finally(() => {
                if (isMounted) setContractLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeTab, contract, user]);

    const displayedContract = contract ?? loadedContract;
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
                                        contractLoading={contractLoading}
                                        onSigned={(signedContract) => {
                                            if (displayedContract?.contractId === "demo-camille-nexora-1") {
                                                const updated = {
                                                    ...displayedContract,
                                                    ...signedContract,
                                                    contractStatus: "STUDENT_SIGNED",
                                                    studentSigned: true,
                                                    studentSignedAt: new Date().toISOString(),
                                                };
                                                saveDemoContract(updated);
                                                setLoadedContract(updated);
                                                return updated;
                                            }
                                            if (/^\d+$/.test(String(displayedContract?.id ?? displayedContract?.contractId ?? ""))) {
                                                const id = displayedContract.id ?? displayedContract.contractId;
                                                return api.student.signContract(id).then(async (response) => {
                                                    if (!response.ok) throw new Error("contract_sign_failed");
                                                    const updated = await response.json();
                                                    setLoadedContract(updated);
                                                    return updated;
                                                });
                                            }
                                        }}
                                    />
                                    <StudentContractsPage user={user}/>
                                )}
                            </div>
                        </>
                    )}
                </StudentCvAccess>
            </div>
        </section>
    );
}
