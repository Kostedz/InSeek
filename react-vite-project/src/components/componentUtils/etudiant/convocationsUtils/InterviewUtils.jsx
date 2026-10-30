function normalizeStatus(value) {
    const normalized = String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    if (["ACCEPTEE", "ACCEPTED"].includes(normalized)) {
        return "ACCEPTED";
    }

    if (["REFUSEE", "REJECTED", "DECLINED"].includes(normalized)) {
        return "REJECTED";
    }

    if (["EXPIRED", "EXPIREE"].includes(normalized)) {
        return "EXPIRED";
    }

    return "PENDING";
}

export function normalizeInterview(item) {
    const date =
        item.DateAndTime ??
        item.dateAndTime ??
        item.dateInterview ??
        item.date;

    const status = normalizeStatus(
        item.interviewInvitationStatus ??
        item.statut ??
        item.status
    );

    const expiredByDate =
        date != null &&
        !Number.isNaN(new Date(date).getTime()) &&
        new Date(date).getTime() <= Date.now();

    return {
        ...item,
        id: item.id,
        title: item.position ?? item.jobTitle ?? item.title ?? "",
        company: item.nomEntreprise ?? item.companyName ?? item.company ?? "",
        date,
        time: item.heureEntrevue ?? item.interviewTime ?? item.time,
        duration: item.duree ?? item.duration,
        mode: item.mode ?? item.modeInterview,
        location: item.locationOrLink ?? item.lieu ?? item.location ?? "",
        meetingLink: item.lienVisio ?? item.meetingLink ?? "",
        message: item.message ?? item.messageEmployeur ?? "",
        status: status === "PENDING" && expiredByDate
            ? "EXPIRED"
            : status,
        responseComment:
            item.messageWhenRejected ?? item.commentaireEtudiant ?? null,
        responseDate:
            item.invitationResponseDate ?? item.dateReponse ?? null,
    };
}

export function getInterviewDate(interview) {
    if (!interview.date) return null;

    const date = new Date(interview.date);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function StatusBadge({status, t}) {
    const styles = {
        PENDING: "border-gold bg-gold/45 text-ink",
        ACCEPTED: "border-[#9ed9bd] bg-[#dff6e8] text-[#245e3b]",
        REJECTED: "border-[#eab0bf] bg-[#fff0f3] text-error",
        EXPIRED: "border-[#ccc] bg-[#f5f5f5] text-ink-soft",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1
                text-xs font-bold ${styles[status] ?? styles.PENDING}`}
        >
            {t(`studentInterviews.status.${status}`)}
        </span>
    );
}

export function FormatDate(interview, language) {
    const date = getInterviewDate(interview);
    if (!date) return null;

    return new Intl.DateTimeFormat(
        language === "en" ? "en-CA" : "fr-CA",
        {dateStyle: "long", timeStyle: "short"}
    ).format(date);
}