import {useTranslation} from "react-i18next";
import {useLocation} from "react-router-dom";
import GestionnaireTabs from "./GestionnaireTabs.jsx";
import GestionnaireValidation from "./GestionnaireValidation.jsx";
import GestionnaireCvValidation from "./GestionnaireCvValidation.jsx";
import GestionnaireStudents from "./GestionnaireStudents.jsx";
import GestionnaireContracts from "./GestionnaireContracts.jsx";
import GestionnaireAssignments from "./GestionnaireAssignments.jsx";

const PAGE_BY_PATH = {
    "/gestionnaire/offres": "offers",
    "/gestionnaire/cv": "cvs",
    "/gestionnaire/etudiants": "students",
    "/gestionnaire/assignation": "assignments",
    "/gestionnaire/contrats": "contracts",
};

const PAGE_COPY = {
    offers: ["managerValidation.title", "managerValidation.description"],
    cvs: ["managerCvValidation.title", "managerCvValidation.description"],
    students: ["managerStudents.title", "managerStudents.description"],
    assignments: ["professorAssignment.title", "professorAssignment.description"],
    contracts: ["managerContracts.title", "managerContracts.description"],
};

export default function GestionnaireDashboard() {
    const {t} = useTranslation();
    const {pathname} = useLocation();
    const activeTab = PAGE_BY_PATH[pathname] ?? "offers";
    const [titleKey, descriptionKey] = PAGE_COPY[activeTab];

    return (
        <section className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                            {t("managerDashboard.eyebrow", "Espace gestionnaire")}
                        </span>
                        <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t(titleKey)}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{t(descriptionKey)}</p>
                    </div>
                    {(activeTab === "offers" || activeTab === "cvs") && (
                        <p className="shrink-0 text-xs font-semibold text-ink-soft">{t("managerValidation.autoRefresh")}</p>
                    )}
                </header>
                <GestionnaireTabs activeTab={activeTab}/>

                {activeTab === "offers" && <GestionnaireValidation embedded hideEmbeddedHeading/>}
                {activeTab === "cvs" && <GestionnaireCvValidation embedded/>}
                {activeTab === "students" && <GestionnaireStudents embedded/>}
                {activeTab === "assignments" && <GestionnaireAssignments/>}
                {activeTab === "contracts" && <GestionnaireContracts embedded/>}
            </div>
        </section>
    );
}
