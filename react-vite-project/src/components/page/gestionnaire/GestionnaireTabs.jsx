import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import api from "../../../utils/api.js";
import {countPendingDocuments, PENDING_DOCUMENT_PROCESSED_EVENT} from "../../../utils/tabCounts.js";
import useSlidingTabIndicator from "../../useSlidingTabIndicator.js";

export default function GestionnaireTabs({activeTab, offersCount, cvsCount}) {
    const {t} = useTranslation();
    const [loadedCounts, setLoadedCounts] = useState({offers: null, cvs: null, students: null, assignments: null});
    const {navRef, tabRefs, indicator, indicatorClassName} = useSlidingTabIndicator(activeTab, "manager-active-tab");

    useEffect(() => {
        let isMounted = true;
        const requests = [];

        if (offersCount === undefined) {
            requests.push(countPendingDocuments("OffreDeStage").then((count) => ["offers", count]));
        }
        if (cvsCount === undefined) {
            requests.push(countPendingDocuments("CV").then((count) => ["cvs", count]));
        }
        requests.push(api.gestionnaire.getEligibleStudents().then(async (response) => {
            if (!response.ok) return ["students", null];
            const data = await response.json();
            const students = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            const studentsWithoutContract = students.filter((student) => !student.hasContract && !student.contractExists).length;
            return ["students", studentsWithoutContract];
        }).catch(() => ["students", null]));
        requests.push(api.gestionnaire.getInternshipStudents().then(async (response) => {
            if (!response.ok) return ["assignments", null];
            const data = await response.json();
            const students = Array.isArray(data) ? data : data.items ?? data.content ?? [];
            const unassignedStudents = students.filter((student) => !student.professeurId).length;
            return ["assignments", unassignedStudents];
        }).catch(() => ["assignments", null]));

        Promise.all(requests).then((results) => {
            if (!isMounted) return;
            setLoadedCounts((current) => ({
                ...current,
                ...Object.fromEntries(results.filter(([, count]) => count !== null)),
            }));
        }).catch(() => {
        });

        return () => {
            isMounted = false;
        };
    }, [offersCount, cvsCount]);

    useEffect(() => {
        const handleProcessedDocument = (event) => {
            const key = event.detail?.type === "CV" ? "cvs"
                : event.detail?.type === "OffreDeStage" ? "offers"
                    : event.detail?.type === "STUDENT_ASSIGNMENT" ? "assignments"
                    : null;
            if (!key) return;

            setLoadedCounts((current) => current[key] === null ? current : ({
                ...current,
                [key]: Math.max(0, current[key] - 1),
            }));
        };

        window.addEventListener(PENDING_DOCUMENT_PROCESSED_EVENT, handleProcessedDocument);
        return () => window.removeEventListener(PENDING_DOCUMENT_PROCESSED_EVENT, handleProcessedDocument);
    }, []);

    const displayedOffersCount = offersCount ?? loadedCounts.offers;
    const displayedCvsCount = cvsCount ?? loadedCounts.cvs;
    const displayedStudentsCount = loadedCounts.students;
    const displayedAssignmentsCount = loadedCounts.assignments;

    const countBadge = (count, ariaLabel) => count === null || count === undefined || count === 0 ? null : (
        <span
            aria-label={ariaLabel}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
            {count}
        </span>
    );

    const tabs = [
        {
            id: "offers",
            label: t("managerValidation.tabs.offers", "Offres à valider"),
            path: "/gestionnaire/offres",
            count: displayedOffersCount
        },
        {
            id: "cvs",
            label: t("managerValidation.tabs.cvs", "CV des étudiants"),
            path: "/gestionnaire/cv",
            count: displayedCvsCount
        },
        {
            id: "students",
            label: t("managerStudents.tabLabel", "Étudiants admissibles"),
            path: "/gestionnaire/etudiants",
            count: displayedStudentsCount,
            countLabel: t("managerContracts.pendingStudentsNotification", {
                count: displayedStudentsCount,
                defaultValue: "{{count}} student(s) without an internship contract",
            }),
        },
        {
            id: "assignments",
            label: t("professorAssignment.tabLabel", "Assignation des professeurs"),
            path: "/gestionnaire/assignation",
            count: displayedAssignmentsCount,
            countLabel: t("professorAssignment.unassignedStudentsNotification", {
                count: displayedAssignmentsCount,
                defaultValue: "{{count}} students without an assigned professor",
            }),
        },
        {id: "contracts", label: t("managerContracts.tabLabel", "Suivi des contrats"), path: "/gestionnaire/contrats"},
    ];

    return (
        <nav
            ref={navRef}
            aria-label={t("navigation.managerMenuAriaLabel", "Navigation du gestionnaire")}
            className="relative mt-7 flex w-full flex-wrap gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-[0_12px_30px_rgba(48,35,55,0.04)] sm:inline-flex sm:w-fit"
        >
            <span aria-hidden="true" className={indicatorClassName} style={indicator ?? {opacity: 0}}/>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        ref={(node) => {
                            tabRefs.current[tab.id] = node;
                        }}
                        className={`relative z-10 inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-colors sm:flex-none ${isActive ? "text-white" : "text-ink-soft hover:bg-lavender/30 hover:text-ink"}`}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            {tab.label} {countBadge(tab.count, tab.countLabel)}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
