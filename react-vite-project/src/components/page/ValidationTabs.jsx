import {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api.js";

async function countPendingDocuments(type) {
    const response = await api.gestionnaire.getPendingDocuments(type);
    if (!response.ok) return null;

    const payload = await response.json();
    const documents = Array.isArray(payload) ? payload : payload.items ?? payload.content ?? [];
    return documents.length;
}

export default function ValidationTabs({activeTab, offersCount, cvsCount}) {
    const [loadedCounts, setLoadedCounts] = useState({offers: null, cvs: null});

    useEffect(() => {
        let isMounted = true;
        const requests = [];

        if (offersCount === undefined) {
            requests.push(countPendingDocuments("OffreDeStage").then((count) => ["offers", count]));
        }
        if (cvsCount === undefined) {
            requests.push(countPendingDocuments("CV").then((count) => ["cvs", count]));
        }

        if (!requests.length) return () => {
            isMounted = false;
        };

        Promise.all(requests).then((results) => {
            if (!isMounted) return;

            setLoadedCounts((current) => ({
                ...current,
                ...Object.fromEntries(results.filter(([, count]) => count !== null)),
            }));
        }).catch(() => {
            // The active page still provides its own up-to-date count.
        });

        return () => {
            isMounted = false;
        };
    }, [offersCount, cvsCount]);

    const displayedOffersCount = offersCount ?? loadedCounts.offers;
    const displayedCvsCount = cvsCount ?? loadedCounts.cvs;

    const countBadge = (count) => count === null || count === undefined ? null : (
        <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-black leading-none text-ink">
            {count}
        </span>
    );

    return (
        <div className="mt-6 flex gap-2 rounded-2xl border border-line bg-surface p-1.5 shadow-sm">
            <Link
                to="/gestionnaire"
                className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-all ${
                    activeTab === "offers"
                        ? "bg-ink text-white shadow-sm"
                        : "text-ink-soft hover:bg-lavender/30 hover:text-ink"
                }`}
            >
                <span
                    className="flex items-center justify-center gap-2">Offres de stage {countBadge(displayedOffersCount)}</span>
            </Link>
            <Link
                to="/gestionnaire/cv"
                className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-all ${
                    activeTab === "cvs"
                        ? "bg-ink text-white shadow-sm"
                        : "text-ink-soft hover:bg-lavender/30 hover:text-ink"
                }`}
            >
                <span
                    className="flex items-center justify-center gap-2">CV des étudiants {countBadge(displayedCvsCount)}</span>
            </Link>
        </div>
    );
}
