import {useState} from "react";
import {useTranslation} from "react-i18next";

const CONTRACT_STORAGE_KEY = "inseek.student.contract.signature";

const CONTRACT_COPY = {
    fr: {
        status: "Signature requise",
        signedStatus: "Signé par vous",
        eyebrow: "Entente de stage",
        title: "Votre contrat est prêt à signer",
        signedTitle: "Votre contrat est signé",
        description: "Prenez le temps de vérifier chaque modalité avant de confirmer votre signature électronique.",
        signedDescription: "Votre signature a été enregistrée et horodatée. Vous pouvez consulter les modalités du stage en tout temps.",
        reference: "Contrat EST-2026-041",
        preview: "Aperçu intégral du contrat",
        previewHint: "Toutes les informations à valider avant votre signature",
        employer: "Employeur et supervision",
        employerName: "Atelier Nordik numérique",
        supervisor: "Sophie Tremblay · Directrice produit",
        student: "Étudiant",
        studentName: "Camille Gagnon",
        position: "Poste",
        positionValue: "Stagiaire en développement web",
        location: "Lieu du stage",
        locationValue: "425, boulevard Saint-Laurent, Montréal · Hybride",
        dates: "Période",
        datesValue: "6 janvier 2027 au 26 mars 2027",
        schedule: "Horaire",
        scheduleValue: "Lundi au vendredi · 9 h à 17 h · 35 h / semaine",
        pay: "Rémunération",
        payValue: "20,50 $ / heure",
        responsibilities: "Tâches et responsabilités",
        responsibilityOne: "Participer au développement et à l’amélioration de fonctionnalités web.",
        responsibilityTwo: "Documenter les solutions et collaborer aux revues de code.",
        responsibilityThree: "Prendre part aux rencontres d’équipe et aux suivis de projet.",
        clauses: "Clauses d’engagement",
        clauseOne: "L’étudiant s’engage à respecter les politiques, les horaires et les règles de confidentialité de l’employeur.",
        clauseTwo: "L’employeur s’engage à fournir un encadrement et des tâches liées aux objectifs pédagogiques du stage.",
        clauseThree: "Toute modification à la présente entente doit être approuvée par les parties concernées.",
        signatureTitle: "Votre signature électronique",
        signatureMeaning: "Votre signature confirme votre identité et votre accord avec l’ensemble des modalités de cette entente de stage.",
        signWithName: "Signer mon nom",
        confirm: "Confirmer et signer",
        signing: "Enregistrement de la signature…",
        signedAt: "Signé le",
        confirmationTitle: "Signature enregistrée",
        confirmationText: "Votre contrat a été signé avec succès. L’employeur et le gestionnaire de stage ont été informés.",
        notification: "Notification envoyée",
        studentCopy: "Une copie signée est maintenant disponible dans votre espace étudiant.",
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
        title: "Your contract is ready to sign",
        signedTitle: "Your contract is signed",
        description: "Take a moment to review every term before confirming your electronic signature.",
        signedDescription: "Your signature was recorded and timestamped. You can review the internship terms at any time.",
        reference: "Contract EST-2026-041",
        preview: "Full contract preview",
        previewHint: "All information to review before signing",
        employer: "Employer and supervision",
        employerName: "Atelier Nordik numérique",
        supervisor: "Sophie Tremblay · Product Director",
        student: "Student",
        studentName: "Camille Gagnon",
        position: "Position",
        positionValue: "Web development intern",
        location: "Internship location",
        locationValue: "425 Saint-Laurent Boulevard, Montreal · Hybrid",
        dates: "Period",
        datesValue: "January 6, 2027 to March 26, 2027",
        schedule: "Schedule",
        scheduleValue: "Monday to Friday · 9 a.m. to 5 p.m. · 35 h / week",
        pay: "Compensation",
        payValue: "$20.50 / hour",
        responsibilities: "Duties and responsibilities",
        responsibilityOne: "Participate in developing and improving web features.",
        responsibilityTwo: "Document solutions and collaborate on code reviews.",
        responsibilityThree: "Take part in team meetings and project follow-ups.",
        clauses: "Terms of engagement",
        clauseOne: "The student agrees to follow the employer’s policies, schedule and confidentiality rules.",
        clauseTwo: "The employer agrees to provide guidance and duties connected to the internship’s learning objectives.",
        clauseThree: "Any change to this agreement must be approved by the parties concerned.",
        signatureTitle: "Your electronic signature",
        signatureMeaning: "Your signature confirms your identity and your agreement with all the terms of this internship agreement.",
        signWithName: "Sign my name",
        confirm: "Confirm and sign",
        signing: "Recording signature…",
        signedAt: "Signed on",
        confirmationTitle: "Signature recorded",
        confirmationText: "Your contract was signed successfully. The employer and internship manager have been notified.",
        notification: "Notification sent",
        studentCopy: "A signed copy is now available in your student space.",
        immutable: "Document locked after signing",
        secure: "Secure signature",
        secureText: "Your signature is linked to your account and the time of confirmation.",
        signingOrderLabel: "Signing order",
        signingOrder: "You → employer → internship manager",
    },
};

function SectionIcon({children}) {
    return <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink text-ink">{children}</span>;
}

function Detail({label, value}) {
    return (
        <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink-soft">{label}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink">{value}</p>
        </div>
    );
}

function CheckIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6"/>
        </svg>
    );
}

export default function ContractSignaturePage({user}) {
    const {i18n} = useTranslation();
    const copy = CONTRACT_COPY[i18n.resolvedLanguage === "en" ? "en" : "fr"];
    const [hasSignature, setHasSignature] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [signedAt, setSignedAt] = useState(() => {
        try {
            return window.localStorage.getItem(CONTRACT_STORAGE_KEY) || "";
        } catch {
            return "";
        }
    });

    const isSigned = Boolean(signedAt);
    const studentName = [user?.firstName ?? user?.prenom, user?.lastName ?? user?.nom]
        .filter(Boolean)
        .join(" ") || copy.studentName;

    const signWithName = () => {
        if (isSigned || isSigning) return;
        setHasSignature(true);
    };

    const submitSignature = (event) => {
        event.preventDefault();
        if (isSigned || !hasSignature) return;

        setIsSigning(true);
        window.setTimeout(() => {
            const timestamp = new Date().toISOString();
            window.localStorage.setItem(CONTRACT_STORAGE_KEY, timestamp);
            setSignedAt(timestamp);
            setIsSigning(false);
        }, 650);
    };

    const formattedSignedAt = signedAt
        ? new Intl.DateTimeFormat(i18n.resolvedLanguage === "en" ? "en-CA" : "fr-CA", {
            dateStyle: "long",
            timeStyle: "short",
        }).format(new Date(signedAt))
        : "";

    return (
        <section className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col gap-5 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span
                            className="inline-flex rounded-full bg-pink px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-ink">
                            {copy.eyebrow}
                        </span>
                        <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight text-ink sm:text-4xl">
                            {isSigned ? copy.signedTitle : copy.title}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
                            {isSigned ? copy.signedDescription : copy.description}
                        </p>
                    </div>
                    <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${isSigned ? "border-green-200 bg-green-50 text-green-800" : "border-gold bg-gold/35 text-ink"}`}>
                        <span className={`h-2 w-2 rounded-full ${isSigned ? "bg-green-600" : "bg-ink"}`}/>
                        {isSigned ? copy.signedStatus : copy.status}
                    </div>
                </div>

                <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
                    <article
                        className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_18px_50px_rgba(48,35,55,0.07)]">
                        <div
                            className="flex flex-col gap-3 border-b border-line bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">{copy.preview}</p>
                                <p className="mt-2 text-sm font-semibold text-white/80">{copy.previewHint}</p>
                            </div>
                            <div
                                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/80">{copy.reference}</div>
                        </div>

                        <div className="space-y-8 p-6 sm:p-8">
                            <div className="flex items-start gap-3">
                                <SectionIcon>
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <path
                                            d="M4 21h16M6 21V5l6-3 6 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/>
                                    </svg>
                                </SectionIcon>
                                <div>
                                    <h2 className="text-base font-black text-ink">{copy.employer}</h2>
                                    <p className="mt-1 text-sm font-bold text-ink">{copy.employerName}</p>
                                    <p className="mt-1 text-sm leading-6 text-ink-soft">{copy.supervisor}</p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Detail label={copy.student} value={studentName}/>
                                <Detail label={copy.position} value={copy.positionValue}/>
                                <Detail label={copy.location} value={copy.locationValue}/>
                                <Detail label={copy.dates} value={copy.datesValue}/>
                                <Detail label={copy.schedule} value={copy.scheduleValue}/>
                                <Detail label={copy.pay} value={copy.payValue}/>
                            </div>

                            <div className="pt-1">
                                <h2 className="text-base font-black text-ink">{copy.responsibilities}</h2>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-soft">
                                    {[copy.responsibilityOne, copy.responsibilityTwo, copy.responsibilityThree].map((item) => (
                                        <li key={item} className="flex gap-3"><span
                                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-peach"/>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-lavender bg-lavender/25 p-5">
                                <h2 className="text-base font-black text-ink">{copy.clauses}</h2>
                                <ol className="mt-4 space-y-3 text-sm leading-6 text-ink-soft">
                                    {[copy.clauseOne, copy.clauseTwo, copy.clauseThree].map((item, index) => (
                                        <li key={item} className="flex gap-3"><span
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-ink">{index + 1}</span>{item}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </article>

                    <aside className="lg:sticky lg:top-6">
                        {isSigned ? (
                            <div
                                className="rounded-[2rem] border border-green-200 bg-green-50 p-6 shadow-[0_18px_50px_rgba(48,35,55,0.06)] sm:p-7">
                                <h2 className="text-2xl font-black tracking-tight text-ink">{copy.confirmationTitle}</h2>
                                <p className="mt-3 text-sm leading-6 text-ink-soft">{copy.confirmationText}</p>
                                <div className="mt-5 rounded-2xl border border-green-200 bg-white/70 p-4">
                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-green-800">{copy.signedAt}</p>
                                    <p className="mt-2 text-sm font-bold text-ink">{formattedSignedAt}</p>
                                </div>
                                <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/70 p-4">
                                    <span className="mt-0.5 text-green-700"><CheckIcon/></span>
                                    <div><p className="text-sm font-black text-ink">{copy.notification}</p><p
                                        className="mt-1 text-xs leading-5 text-ink-soft">{copy.studentCopy}</p></div>
                                </div>
                                <p className="mt-5 flex items-center gap-2 text-xs font-bold text-green-800"><span
                                    className="h-2 w-2 rounded-full bg-green-600"/>{copy.immutable}</p>
                            </div>
                        ) : (
                            <form onSubmit={submitSignature}
                                  className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.07)] sm:p-7">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-ink">{copy.signatureTitle}</h2>
                                    <p className="mt-3 rounded-xl bg-lavender/25 px-3 py-2 text-xs font-semibold leading-5 text-ink-soft">{copy.signatureMeaning}</p>
                                </div>

                                <div
                                    className="mt-6 flex items-start gap-3 rounded-2xl border border-gold bg-gold/20 p-4">
                                    <span className="mt-0.5 text-ink"><svg aria-hidden="true" className="h-5 w-5"
                                                                           viewBox="0 0 24 24" fill="none"
                                                                           stroke="currentColor" strokeWidth="1.8"
                                                                           strokeLinecap="round" strokeLinejoin="round"><rect
                                        x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>
                                    <div><p className="text-xs font-black text-ink">{copy.secure}</p><p
                                        className="mt-1 text-xs leading-5 text-ink-soft">{copy.secureText}</p></div>
                                </div>

                                <div
                                    className="relative mt-4 h-[190px] overflow-hidden rounded-2xl border-2 border-line bg-canvas">
                                    {hasSignature && (
                                        <span
                                            className="absolute bottom-8 left-6 text-4xl italic text-ink"
                                            style={{fontFamily: "'Brush Script MT', 'Segoe Script', 'URW Chancery L', cursive"}}
                                        >
                                            {studentName}
                                        </span>
                                    )}
                                    <span
                                        className="pointer-events-none absolute bottom-5 left-5 right-5 border-b border-ink/30"/>
                                    {!hasSignature && (
                                        <button
                                            type="button"
                                            onClick={signWithName}
                                            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg border border-ink/15 bg-surface/95 px-3 py-1.5 text-xs font-black text-ink shadow-sm transition-colors hover:bg-pink disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isSigning}
                                        >
                                            {copy.signWithName}
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!hasSignature || isSigning}
                                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition-colors ${hasSignature && !isSigning ? "bg-ink text-white hover:bg-ink-soft" : "cursor-not-allowed bg-line text-ink-soft"}`}
                                >
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
                            <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3 text-xs">
                                <p className="font-black uppercase tracking-[0.1em] text-ink-soft">{copy.signingOrderLabel}</p>
                                <p className="mt-1 font-bold text-ink">{copy.signingOrder}</p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </section>
    );
}
