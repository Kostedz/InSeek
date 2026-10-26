import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ScheduleInterviewModal from "../components/componentUtils/employeur/ScheduleInterviewModal.jsx";
import { api } from "../utils/api.js";

vi.mock("react-i18next", () => {
    const t = (key, def) => (typeof def === "string" ? def : key);
    return { useTranslation: () => ({ t }) };
});

vi.mock("../utils/i18nMessage.js", () => ({
    translateMessage: (t, message) => (typeof message === "string" ? message : message?.key ?? ""),
}));

vi.mock("../utils/api.js", () => ({
    api: { employer: { offers: { planifierEntrevue: vi.fn(), modifierEntrevue: vi.fn() } } },
}));

const FUTURE_DATE = `${new Date().getFullYear() + 2}-01-15`;
const CANDIDAT = { id: 7, name: "Alice Martin" };
const planifier = api.employer.offers.planifierEntrevue;
const modifier = api.employer.offers.modifierEntrevue;

const fieldOf = (name) => document.querySelector(`[name="${name}"]`);
const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Confirmer l'entrevue" }));

function renderModal(props = {}) {
    const onSuccess = vi.fn();
    render(<ScheduleInterviewModal offerId={3} candidat={CANDIDAT} onClose={() => {}} onSuccess={onSuccess} {...props} />);
    return { onSuccess };
}

function fillForm({ date = FUTURE_DATE, lieuOuLien = "123 rue Test" } = {}) {
    fireEvent.change(fieldOf("date"), { target: { value: date } });
    fireEvent.change(fieldOf("heure"), { target: { value: "10:00" } });
    fireEvent.change(fieldOf("lieuOuLien"), { target: { value: lieuOuLien } });
}

describe("En tant qu'employeur, je planifie une entrevue (formulaire)", () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.resetAllMocks();
    });

    it("refuse un formulaire vide sans appeler l'API", () => {
        renderModal();
        confirm();

        expect(screen.getByText("La date est requise.")).toBeInTheDocument();
        expect(screen.getByText("L'heure est requise.")).toBeInTheDocument();
        expect(screen.getByText("Le lieu ou le lien est requis.")).toBeInTheDocument();
        expect(planifier).not.toHaveBeenCalled();
    });

    it("refuse une date dans le passé", () => {
        renderModal();
        fillForm({ date: "2020-01-01" });
        confirm();

        expect(screen.getByText("La date doit être située dans le futur.")).toBeInTheDocument();
        expect(planifier).not.toHaveBeenCalled();
    });

    it("envoie un POST avec les bonnes données", async () => {
        planifier.mockResolvedValue({ ok: true });
        renderModal();
        fillForm({ lieuOuLien: "  Salle 204  " });
        confirm();

        await waitFor(() => expect(planifier).toHaveBeenCalledWith(3, 7, {
            dateHeure: `${FUTURE_DATE}T10:00:00`,
            mode: "VIDEO_CALL",
            lieuOuLien: "Salle 204",
            messageOptionnel: "",
        }));
        expect(modifier).not.toHaveBeenCalled();
    });

    it("affiche le succès, prévient le parent et vide le brouillon", async () => {
        planifier.mockResolvedValue({ ok: true });
        const { onSuccess } = renderModal();
        fillForm();
        confirm();

        expect(await screen.findByText("Entrevue planifiée avec succès !")).toBeInTheDocument();
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ lieuOuLien: "123 rue Test" }));
        expect(sessionStorage.getItem("interview_draft_3_7")).toBeNull();
    });

    it("utilise le PUT en mode modification", async () => {
        modifier.mockResolvedValue({ ok: true });
        renderModal({ candidat: { ...CANDIDAT, isEdit: true } });
        fillForm();
        fireEvent.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

        await waitFor(() => expect(modifier).toHaveBeenCalledWith(3, 7, expect.any(Object)));
        expect(planifier).not.toHaveBeenCalled();
    });

    it("affiche l'erreur du serveur et garde le formulaire", async () => {
        const message = "Une entrevue a déjà été planifiée pour cet étudiant et cette offre de stage.";
        planifier.mockResolvedValue({ ok: false, json: async () => ({ message }) });
        renderModal();
        fillForm();
        confirm();

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText("Entrevue planifiée avec succès !")).not.toBeInTheDocument();
        expect(fieldOf("lieuOuLien")).toHaveValue("123 rue Test");
    });
});