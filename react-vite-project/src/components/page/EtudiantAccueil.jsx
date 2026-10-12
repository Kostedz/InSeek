import React from "react";
import {useTranslation} from "react-i18next";

export default function EtudiantAccueil({user}) {
    const {t} = useTranslation();
    const firstName = user?.firstName ?? user?.prenom ?? "";

    return (
        <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div
                className="w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-7 text-center shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-12">
                <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                    {t("studentHome.welcome", {name: firstName ? ` ${firstName}` : ""})}
                </h1>
            </div>
        </section>
    );
}
