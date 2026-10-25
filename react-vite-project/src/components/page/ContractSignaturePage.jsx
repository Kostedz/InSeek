import {useState} from "react";
import {useTranslation} from "react-i18next";

const CONTRACT_COPY = {
    fr: {
        status: "Signature requise",
        signedStatus: "Signé par vous",
        eyebrow: "Entente de stage",
        signedDescription: "Votre signature a été enregistrée et horodatée. Vous pouvez consulter les modalités du stage en tout temps.",
        preview: "Contrat",
        contractNumber: "Numéro du contrat",
        firstName: "Prénom de l'étudiant",
        lastName: "Nom de l'étudiant",
        company: "Nom de l'entreprise",
        employerFirstName: "Prénom de l'employeur",
        employerLastName: "Nom de l'employeur",
        supervisor: "Nom du superviseur",
        managerFirstName: "Prénom du gestionnaire",
        managerLastName: "Nom du gestionnaire",
        position: "Poste",
        description: "Description du poste",
        startDate: "Date de début",
        endDate: "Date de fin",
        weeklyHours: "Heures par semaine",
        hourlySalary: "Rémunération horaire",
        location: "Lieu du stage",
        contractIntro: "Le présent contrat de stage est conclu entre l'étudiant",
        and: "et l'entreprise",
        representedBy: "représentée par",
        supervisorIntro: "Le stage sera supervisé par",
        managerIntro: "et suivi par le gestionnaire",
        internshipIntro: "L'étudiant effectuera un stage au poste de",
        descriptionIntro: "La description du poste est la suivante :",
        periodIntro: "La période de stage s'étend du",
        periodSeparator: "au",
        locationIntro: "Le stage se déroulera à l'endroit suivant :",
        hoursIntro: "La charge de travail prévue est de",
        hoursSuffix: "heures par semaine",
        salaryIntro: "La rémunération prévue est de",
        salarySuffix: "de l'heure.",
        commitmentsTitle: "Engagements des parties",
        studentCommitment: "L'étudiant s'engage à respecter les politiques, les horaires et les règles de confidentialité de l'entreprise.",
        employerCommitment: "L'entreprise s'engage à fournir un encadrement et des tâches liées aux objectifs pédagogiques du stage.",
        modificationCommitment: "Toute modification au présent contrat doit être approuvée par les parties concernées.",
        signatureTitle: "Votre signature électronique",
        signatureMeaning: "Votre signature confirme votre identité et votre accord avec l’ensemble des modalités de cette entente de stage.",
        signWithName: "Signer mon nom",
        confirm: "Confirmer et signer",
        signing: "Enregistrement de la signature…",
        confirmationTitle: "Signature enregistrée",
        immutable: "Document verrouillé après signature",
        secure: "Signature sécurisée",
        secureText: "Votre signature est associée à votre compte et à l’heure de confirmation.",
        signingOrderLabel: "Ordre de signature",
        signingOrder: "Vous → employeur → gestionnaire de stage",
    },
    en: {
        status: "Signature required",
        signedStatus: "Signed by you",
        eyebrow: "Internship agreement",
        signedDescription: "Your signature was recorded and timestamped. You can review the internship terms at any time.",
        preview: "Contract",
        contractNumber: "Contract number",
        firstName: "Student first name",
        lastName: "Student last name",
        company: "Company name",
        employerFirstName: "Employer first name",
        employerLastName: "Employer last name",
        supervisor: "Supervisor name",
        managerFirstName: "Manager first name",
        managerLastName: "Manager last name",
        position: "Position",
        description: "Position description",
        startDate: "Start date",
        endDate: "End date",
        weeklyHours: "Hours per week",
        hourlySalary: "Hourly compensation",
        location: "Internship location",
        contractIntro: "This internship agreement is entered into by the student",
        and: "and the company",
        representedBy: "represented by",
        supervisorIntro: "The internship will be supervised by",
        managerIntro: "and followed by the internship manager",
        internshipIntro: "The student will complete an internship in the position of",
        descriptionIntro: "The position is described as follows:",
        periodIntro: "The internship period runs from",
        periodSeparator: "to",
        locationIntro: "The internship will take place at the following location:",
        hoursIntro: "The expected workload is",
        hoursSuffix: "hours per week",
        salaryIntro: "The expected compensation is",
        salarySuffix: "per hour.",
        commitmentsTitle: "Commitments of the parties",
        studentCommitment: "The student agrees to follow the company’s policies, schedule and confidentiality rules.",
        employerCommitment: "The company agrees to provide guidance and duties connected to the internship’s learning objectives.",
        modificationCommitment: "Any change to this agreement must be approved by the parties concerned.",
        signatureTitle: "Your electronic signature",
        signatureMeaning: "Your signature confirms your identity and your agreement with all the terms of this internship agreement.",
        signWithName: "Sign my name",
        confirm: "Confirm and sign",
        signing: "Recording signature…",
        confirmationTitle: "Signature recorded",
        immutable: "Document locked after signing",
        secure: "Secure signature",
        secureText: "Your signature is linked to your account and the time of confirmation.",
        signingOrderLabel: "Signing order",
        signingOrder: "You → employer → internship manager",
    },
};

function ContractValue({value, label}) {
    const isMissing = value === null || value === undefined || value === "";
    return <strong className="font-black text-ink">{isMissing ? label : value}</strong>;
}

function CheckIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6"/>
        </svg>
    );
}

export default function ContractSignaturePage({user, contract}) {
    const {i18n} = useTranslation();
    const copy = CONTRACT_COPY[i18n.resolvedLanguage === "en" ? "en" : "fr"];
    const [hasSignature, setHasSignature] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isLocallySigned, setIsLocallySigned] = useState(false);

    const student = contract?.student ?? {};
    const employee = contract?.employee ?? {};
    const internshipOffer = contract?.internshipOffer ?? {};
    const admin = contract?.admin ?? {};
    const firstName = student.prenom ?? user?.firstName ?? user?.prenom;
    const lastName = student.nom ?? user?.lastName ?? user?.nom;
    const studentName = [firstName, lastName].filter(Boolean).join(" ");
    const employerName = employee.nomCompagnie ?? internshipOffer.nomEntreprise;
    const position = internshipOffer.position;
    const positionDescription = internshipOffer.descriptionPosition;
    const startDate = contract?.startingDate;
    const endDate = contract?.endingDate;
    const weeklyHours = contract?.weeklyHours;
    const hourlySalary = contract?.hourlySalary;
    const location = contract?.internshipLocation;
    const contractNumber = contract?.contractId;
    const backendStatus = String(contract?.contractStatus ?? "").toUpperCase();
    const isSigned = backendStatus === "SIGNED" || isLocallySigned;

    const formatDate = (value) => {
        if (!value) return "";
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
        return Number.isNaN(date.getTime())
            ? String(value)
            : new Intl.DateTimeFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {dateStyle: "medium"}).format(date);
    };

    const formatSalary = (value) => {
        if (value === null || value === undefined || value === "") return "";
        const amount = Number(value);
        return Number.isNaN(amount)
            ? String(value)
            : new Intl.NumberFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {
                style: "currency",
                currency: "CAD"
            }).format(amount);
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const formattedSalary = formatSalary(hourlySalary);
    const formattedWeeklyHours = weeklyHours === null || weeklyHours === undefined || weeklyHours === ""
        ? ""
        : `${weeklyHours} h`;

    const signWithName = () => {
        if (isSigned || isSigning) return;
        setHasSignature(true);
    };

    const submitSignature = (event) => {
        event.preventDefault();
        if (isSigned || !hasSignature) return;

        setIsSigning(true);
        window.setTimeout(() => {
            setIsLocallySigned(true);
            setIsSigning(false);
        }, 650);
    };

    return (
        <div
            className="mt-7 overflow-hidden rounded-[1.75rem] border border-line bg-canvas shadow-[0_18px_50px_rgba(48,35,55,0.07)]">
            <div
                className="flex flex-col gap-4 bg-gradient-to-br from-ink via-ink to-[#5d426b] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink text-ink">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor"
                             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7.5h16v12H4zM8 7.5V5h8v2.5M8 12h8M8 15.5h5"/>
                        </svg>
                    </span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">{copy.eyebrow}</p>
                        <p className="mt-1 text-lg font-black tracking-tight">{copy.preview}</p>
                        <p className="mt-0.5 text-xs font-semibold text-white/60">{copy.contractNumber}: <ContractValue
                            value={contractNumber} label={copy.contractNumber}/></p>
                    </div>
                </div>
                <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${isSigned ? "border-green-200/30 bg-green-300/15 text-green-100" : "border-gold/40 bg-gold/15 text-gold"}`}>
                    <span className={`h-2 w-2 rounded-full ${isSigned ? "bg-green-300" : "bg-gold"}`}/>
                    {isSigned ? copy.signedStatus : copy.status}
                </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(290px,0.7fr)] lg:items-start">
                <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                    <div className="flex items-center gap-3 border-b border-line pb-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink text-ink">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path
                                    d="M4 21h16M6 21V5l6-3 6 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/>
                            </svg>
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-soft">{copy.preview}</p>
                            <p className="mt-1 text-sm font-black text-ink">{copy.eyebrow}</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4 text-sm leading-7 text-ink-soft">
                        <p>
                            {copy.contractIntro} <ContractValue value={firstName} label={copy.firstName}/>
                            <ContractValue value={lastName} label={copy.lastName}/> {copy.and}{" "}
                            <ContractValue value={employerName} label={copy.company}/> {copy.representedBy}{" "}
                            <ContractValue value={employee.prenom} label={copy.employerFirstName}/> <ContractValue
                            value={employee.nom} label={copy.employerLastName}/>. {copy.supervisorIntro}{" "}
                            <ContractValue value={contract?.supervisorName}
                                           label={copy.supervisor}/> {copy.managerIntro}{" "}
                            <ContractValue value={admin.prenom} label={copy.managerFirstName}/> <ContractValue
                            value={admin.nom} label={copy.managerLastName}/>.
                        </p>

                        <p>
                            {copy.internshipIntro} <ContractValue value={position}
                                                                  label={copy.position}/>. {copy.descriptionIntro}{" "}
                            <ContractValue value={positionDescription} label={copy.description}/>
                        </p>

                        <p>
                            {copy.periodIntro} <ContractValue value={formattedStartDate}
                                                              label={copy.startDate}/> {copy.periodSeparator}{" "}
                            <ContractValue value={formattedEndDate} label={copy.endDate}/>. {copy.locationIntro}{" "}
                            <ContractValue value={location} label={copy.location}/>. {copy.hoursIntro}{" "}
                            <ContractValue value={formattedWeeklyHours}
                                           label={copy.weeklyHours}/> {copy.hoursSuffix} {copy.salaryIntro}{" "}
                            <ContractValue value={formattedSalary} label={copy.hourlySalary}/> {copy.salarySuffix}
                        </p>

                        <div className="border-t border-line pt-4">
                            <h2 className="text-sm font-black text-ink">{copy.commitmentsTitle}</h2>
                            <p className="mt-2">{copy.studentCommitment}</p>
                            <p className="mt-2">{copy.employerCommitment}</p>
                            <p className="mt-2">{copy.modificationCommitment}</p>
                        </div>
                    </div>
                </article>

                <aside className="lg:sticky lg:top-6">
                    {isSigned ? (
                        <div className="relative rounded-2xl border border-green-200 bg-green-50 p-5">
                            <span
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700">
                                <CheckIcon/>
                            </span>
                            <div className="pr-12">
                                <h2 className="text-lg font-black tracking-tight text-ink">{copy.confirmationTitle}</h2>
                                <p className="mt-1 text-xs leading-5 text-ink-soft">{copy.signedDescription}</p>
                            </div>
                            <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-green-800"><span
                                className="h-2 w-2 rounded-full bg-green-600"/>{copy.immutable}</p>
                        </div>
                    ) : (
                        <form onSubmit={submitSignature}
                              className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-ink">{copy.signatureTitle}</h2>
                                    <p className="mt-1 text-xs leading-5 text-ink-soft">{copy.signatureMeaning}</p>
                                </div>
                                <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/35 text-ink">
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                         strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="2"/><path
                                        d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                                </span>
                            </div>

                            <div className="mt-4 rounded-xl border border-gold bg-gold/20 px-3 py-2.5">
                                <p className="text-xs font-black text-ink">{copy.secure}</p>
                                <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{copy.secureText}</p>
                            </div>

                            <div
                                className="relative mt-4 h-32 overflow-hidden rounded-xl border-2 border-line bg-canvas">
                                {hasSignature && (
                                    <span className="absolute bottom-7 left-5 text-3xl italic text-ink"
                                          style={{fontFamily: "'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive"}}>
                                        {studentName}
                                    </span>
                                )}
                                <span
                                    className="pointer-events-none absolute bottom-4 left-5 right-5 border-b border-ink/30"/>
                                {!hasSignature && (
                                    <button type="button" onClick={signWithName}
                                            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-lg border border-ink/15 bg-surface/95 px-3 py-1.5 text-xs font-black text-ink shadow-sm transition-colors hover:bg-pink disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isSigning}>
                                        {copy.signWithName}
                                    </button>
                                )}
                            </div>

                            <button type="submit" disabled={!hasSignature || isSigning}
                                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-colors ${hasSignature && !isSigning ? "bg-ink text-white hover:bg-ink-soft" : "cursor-not-allowed bg-line text-ink-soft"}`}>
                                {isSigning ? copy.signing : copy.confirm}
                                {hasSignature && !isSigning &&
                                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path d="M5 12h14M13 6l6 6-6 6"/>
                                    </svg>}
                            </button>
                        </form>
                    )}

                    {!isSigned && (
                        <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs">
                            <p className="font-black uppercase tracking-[0.1em] text-ink-soft">{copy.signingOrderLabel}</p>
                            <p className="mt-1 font-bold text-ink">{copy.signingOrder}</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
