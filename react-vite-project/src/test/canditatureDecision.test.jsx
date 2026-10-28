import React from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {cleanup, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import EmployeurOffres from "../components/page/employeur/EmployeurOffres.jsx";

const apiMock = vi.hoisted(() => ({
    employer: {
        offers: {list: vi.fn(), create: vi.fn(), update: vi.fn()},
        applications: {list: vi.fn(), accept: vi.fn(), reject: vi.fn()},
    },
}));

vi.mock("../utils/api.js", () => ({default: apiMock}));
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key, fallback) => (typeof fallback === "string" ? fallback : key),
        i18n: {resolvedLanguage: "fr"},
    }),
}));
vi.mock("../utils/i18nMessage.js", () => ({
    translateMessage: (_t, message) => (typeof message === "string" ? message : message?.key ?? ""),
}));
vi.mock("../components/Loading.jsx", () => ({default: () => <div/>}));
vi.mock("../components/ErrorPage.jsx", () => ({default: () => <div/>}));
vi.mock("../components/PdfPreview.jsx", () => ({default: () => null}));
vi.mock("../components/page/employeurOffresUtils.js", () => ({formatOfferTitle: (value) => value}));
vi.mock("../components/employer/ScheduleInterviewModal.jsx", () => ({default: () => <div/>}));

const OFFERS = [{id: 1, statut: "VALIDE", position: "Développeur web", fileName: "offre.pdf"}];
const APPLICATION = {id: 10, studentId: 5, name: "Demo Étudiant", email: "demo.etudiant@inseek.local", status: "PENDING"};

const jsonResponse = (data, {ok = true, status = 200} = {}) => ({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
});

async function openApplicationDetails(user) {
    render(<EmployeurOffres offers={OFFERS}/>);
    await user.click(screen.getByRole("button", {name: "employerOffers.actions.applications"}));
    await user.click(await screen.findByRole("button", {name: /Demo Étudiant/}));
    await screen.findByRole("heading", {name: "Demo Étudiant"});
}

const acceptButton = () => screen.queryByRole("button", {name: "Accepter"});
const rejectButton = () => screen.queryByRole("button", {name: "Refuser"});
const interviewButton = () => screen.getByRole("button", {name: "Planifier une entrevue"});

// ---- Tests ----
describe("Employeur - accepter ou refuser une candidature", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiMock.employer.applications.list.mockResolvedValue(jsonResponse([APPLICATION]));
        apiMock.employer.applications.accept.mockResolvedValue(jsonResponse({}));
        apiMock.employer.applications.reject.mockResolvedValue(jsonResponse({}));
    });

    afterEach(cleanup);

    it("accepte la candidature: statut mis à jour, boutons retirés, entrevue désactivée", async () => {
        const user = userEvent.setup();
        await openApplicationDetails(user);

        await user.click(acceptButton());
        await user.click(screen.getByRole("button", {name: "Confirmer"}));

        await waitFor(() => expect(apiMock.employer.applications.accept).toHaveBeenCalledWith(10));
        expect(await screen.findByText("Acceptée")).toBeInTheDocument();
        expect(screen.queryByText("En attente")).not.toBeInTheDocument();
        expect(acceptButton()).not.toBeInTheDocument();
        expect(rejectButton()).not.toBeInTheDocument();
        expect(interviewButton()).toBeDisabled();
    });

    it("refuse sans commentaire: erreur affichée, API non appelée", async () => {
        const user = userEvent.setup();
        await openApplicationDetails(user);

        await user.click(rejectButton());
        await user.click(screen.getByRole("button", {name: "Confirmer"}));

        expect(screen.getByText("Un commentaire expliquant le refus est obligatoire.")).toBeInTheDocument();
        expect(apiMock.employer.applications.reject).not.toHaveBeenCalled();
    });

    it("refuse avec un commentaire: statut mis à jour, motif affiché, boutons retirés", async () => {
        const user = userEvent.setup();
        await openApplicationDetails(user);

        await user.click(rejectButton());
        await user.type(screen.getByPlaceholderText("Saisissez les raisons du refus..."), "Profil non adapté");
        await user.click(screen.getByRole("button", {name: "Confirmer"}));

        await waitFor(() =>
            expect(apiMock.employer.applications.reject).toHaveBeenCalledWith(10, "Profil non adapté")
        );
        expect(await screen.findByText("Refusée")).toBeInTheDocument();
        expect(screen.getByText("Profil non adapté")).toBeInTheDocument();
        expect(acceptButton()).not.toBeInTheDocument();
        expect(rejectButton()).not.toBeInTheDocument();
        expect(interviewButton()).toBeDisabled();
    });
});