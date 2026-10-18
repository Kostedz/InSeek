import React from "react";
import {describe, expect, it, vi} from "vitest";
import App from "../App.jsx";
import fetcher from "../utils/fetcher.js";
import {renderWithProviders, screen} from "./test-utils.jsx";

vi.mock("../utils/fetcher.js", () => ({default: vi.fn()}));
vi.mock("../components/PdfPreview.jsx", () => ({default: () => null}));

function mockAuthenticatedBackend(user) {
    fetcher.mockImplementation(async (input) => {
        const path = String(input);

        if (path.includes("user/me")) {
            return new Response(JSON.stringify(user), {status: 200});
        }
        if (path.includes("documents/student/cv")) {
            return new Response(null, {status: 204});
        }
        if (path.includes("employeur/offres") || path.includes("gestionnaire/documents/pending")) {
            return new Response("[]", {status: 200});
        }

        return new Response(null, {status: 404});
    });
    localStorage.setItem("token", "test-token");
}

describe("application page access", () => {
    it("redirects an unauthenticated visitor away from a protected page", async () => {
        renderWithProviders(<App/>, {route: "/employeur"});

        expect(await screen.findByRole("heading", {name: "Bon retour."})).toBeInTheDocument();
        expect(screen.queryByRole("heading", {name: "Publiez vos offres de stage"})).not.toBeInTheDocument();
    });

    it.each([
        ["employer", "ROLE_EMPLOYEUR", "/employeur", "Publiez vos offres de stage"],
        ["student", "ROLE_ETUDIANT", "/etudiant", "Téléverser mon CV"],
        ["manager", "ROLE_GESTIONNAIRE", "/gestionnaire", "Validation des offres"],
    ])("allows the %s role to access its workspace", async (_label, role, route, heading) => {
        mockAuthenticatedBackend({
            id: 7,
            email: "user@example.com",
            role,
            isLoggedIn: true,
            emailValidated: true,
            nomCompagnie: "NovaLab",
        });

        renderWithProviders(<App/>, {route});

        expect(await screen.findByRole("heading", {name: heading})).toBeInTheDocument();
    });

    it("shows access denied when a logged-in user opens another role's page", async () => {
        mockAuthenticatedBackend({
            id: 7,
            email: "employer@example.com",
            role: "ROLE_EMPLOYEUR",
            isLoggedIn: true,
        });

        renderWithProviders(<App/>, {route: "/gestionnaire"});

        expect(await screen.findByRole("heading", {name: "Accès refusé"})).toBeInTheDocument();
        expect(screen.queryByRole("heading", {name: "Validation des offres"})).not.toBeInTheDocument();
    });
});
