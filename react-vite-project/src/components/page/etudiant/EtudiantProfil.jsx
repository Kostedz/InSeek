import React, {useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {api} from "../../../utils/api.js";
import {DisciplineEnum} from "../../../constants/disciplines.js";

const disciplines = Object.values(DisciplineEnum).map(({value}) => value);

function disciplineTranslationKey(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export default function EtudiantProfil({user, setUser}) {
    const {t} = useTranslation();
    const currentDiscipline = user?.discipline ?? "";
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDiscipline, setSelectedDiscipline] = useState(currentDiscipline);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const currentDisciplineLabel = currentDiscipline
        ? t(`auth.register.disciplines.${disciplineTranslationKey(currentDiscipline)}`, {
            defaultValue: currentDiscipline,
        })
        : t("studentProfile.notSpecified");

    const openEditor = () => {
        setSelectedDiscipline(currentDiscipline);
        setErrorMessage("");
        setSuccessMessage("");
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setSelectedDiscipline(currentDiscipline);
        setErrorMessage("");
        setIsEditing(false);
    };

    const saveDiscipline = async (event) => {
        event.preventDefault();
        if (!selectedDiscipline || selectedDiscipline === currentDiscipline) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await api.student.updateDiscipline(selectedDiscipline);
            if (!response.ok) {
                setErrorMessage(response.status === 403
                    ? "studentProfile.errors.forbidden"
                    : "studentProfile.errors.save");
                return;
            }

            const updatedUser = await response.json();
            setUser?.((previousUser) => ({
                ...previousUser,
                ...updatedUser,
            }));
            setIsEditing(false);
            setSuccessMessage("studentProfile.success.updated");
        } catch {
            setErrorMessage("studentProfile.errors.connection");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="flex flex-1 items-start px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div
                className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-9">
                <span
                    className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">
                    {t("studentProfile.label")}
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                    {t("studentProfile.title")}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                    {t("studentProfile.description")}
                </p>

                <section className="mt-8 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                    <h2 className="text-lg font-black text-ink">{t("studentProfile.information")}</h2>
                    <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("auth.register.firstName")}</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">{user?.prenom ?? ""}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("auth.register.lastName")}</dt>
                            <dd className="mt-1 text-sm font-semibold text-ink">{user?.nom ?? ""}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("auth.register.email")}</dt>
                            <dd className="mt-1 break-words text-sm font-semibold text-ink">{user?.email ?? ""}</dd>
                        </div>
                    </dl>
                </section>

                <section className="mt-5 rounded-2xl border border-line bg-canvas p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t("studentProfile.discipline")}</p>
                            {!isEditing && <p className="mt-1 text-lg font-black text-ink">{currentDisciplineLabel}</p>}
                        </div>
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={openEditor}
                                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft focus:outline-none focus:ring-4 focus:ring-lavender/60"
                            >
                                {t("studentProfile.edit")}
                            </button>
                        )}
                    </div>

                    {isEditing && (
                        <form className="mt-4 space-y-4" onSubmit={saveDiscipline}>
                            <label htmlFor="student-discipline" className="text-sm font-bold text-ink">
                                {t("studentProfile.selectDiscipline")}
                            </label>
                            <select
                                id="student-discipline"
                                value={selectedDiscipline}
                                onChange={(event) => setSelectedDiscipline(event.target.value)}
                                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-lavender focus:ring-4 focus:ring-pink/40"
                            >
                                {disciplines.map((discipline) => (
                                    <option key={discipline} value={discipline}>
                                        {t(`auth.register.disciplines.${disciplineTranslationKey(discipline)}`, {defaultValue: discipline})}
                                    </option>
                                ))}
                            </select>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lavender/30"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSaving ? t("studentProfile.saving") : t("studentProfile.save")}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                <p className="mt-5 rounded-xl border border-peach bg-peach/40 px-4 py-3 text-sm leading-6 text-ink">
                    {t("studentProfile.cvNotice")}
                </p>

                {errorMessage &&
                    <p className="mt-4 rounded-xl border border-error bg-blush/30 px-4 py-3 text-sm font-medium text-error"
                       role="alert">{t(errorMessage)}</p>}
                {successMessage &&
                    <p className="mt-4 rounded-xl border border-lemon bg-lemon/45 px-4 py-3 text-sm font-medium text-ink"
                       role="status">{t(successMessage)}</p>}

                <Link
                    to="/"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-line bg-lavender/45 px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-lavender focus:outline-none focus:ring-4 focus:ring-lavender/60"
                >
                    {t("studentProfile.backHome")}
                </Link>
            </div>
        </section>
    );
}
