import React from "react";
import {describe, expect, it} from "vitest";
import {Link, Route, Routes} from "react-router-dom";
import Header from "../components/Header.jsx";
import MainContainer from "../components/MainContainer.jsx";
import ErrorPage from "../components/ErrorPage.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";
import {fireEvent, renderWithProviders, screen, waitFor} from "./test-utils.jsx";

describe("site navigation and access", () => {
    it("shows the public home calls to action", () => {
        renderWithProviders(<MainContainer user={{}}/>);

        expect(screen.getByRole("heading", {name: /Trouvez votre prochaine expérience/i})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Se connecter"})).toHaveAttribute("href", "/login");
        expect(screen.getByRole("link", {name: "Créer un compte"})).toHaveAttribute("href", "/register");
    });

    it("switches the header language", async () => {
        renderWithProviders(<Header user={{}}/>);

        expect(screen.getByRole("button", {name: "Passer à l’anglais"})).toHaveTextContent("English");
        fireEvent.click(screen.getByRole("button", {name: "Passer à l’anglais"}));

        await waitFor(() => {
            expect(screen.getByRole("button", {name: "Switch to French"})).toHaveTextContent("Français");
        });
    });

    it("renders a translated 404 page", () => {
        renderWithProviders(<ErrorPage error={{status: 404}}/>);

        expect(screen.getByRole("heading", {name: "Page introuvable"})).toBeInTheDocument();
        expect(screen.getByText("La page que vous recherchez n'existe pas ou a été déplacée.")).toBeInTheDocument();
    });

    it("redirects unauthenticated users to login", () => {
        renderWithProviders(
            <Routes>
                <Route path="/private" element={
                                            <ProtectedRoute user={null} authChecked allowedRoles={["ETUDIANT"]}>
                                               <p>Privé</p>
                                           </ProtectedRoute>
                                       }/>
                <Route path="/login" element={<p>Connexion</p>}/>
            </Routes>,
            {route: "/private"},
        );

        expect(screen.getByText("Connexion")).toBeInTheDocument();
        expect(screen.queryByText("Privé")).not.toBeInTheDocument();
    });

    it("redirects an authenticated user without the required role to an error page", () => {
        renderWithProviders(
            <Routes>
                <Route path="/private" element={
                                            <ProtectedRoute user={{isLoggedIn: true, role: "ROLE_EMPLOYEUR"}}
                                                            authChecked allowedRoles={["ETUDIANT"]}>
                                               <p>Privé</p>
                                           </ProtectedRoute>
                                       }/>
                <Route path="/error" element={<ErrorPage/>}/>
            </Routes>,
            {route: "/private"},
        );

        expect(screen.getByRole("heading", {name: "Accès refusé"})).toBeInTheDocument();
        expect(screen.queryByText("Privé")).not.toBeInTheDocument();
    });
});
