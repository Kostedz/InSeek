import React from "react";
import { Link } from "react-router-dom";

export default function ValidationTabs({ activeTab }) {
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
                Offres de stage
            </Link>
            <Link
                to="/gestionnaire/cv"
                className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition-all ${
                    activeTab === "cvs"
                        ? "bg-ink text-white shadow-sm"
                        : "text-ink-soft hover:bg-lavender/30 hover:text-ink"
                }`}
            >
                CV des étudiants
            </Link>
        </div>
    );
}