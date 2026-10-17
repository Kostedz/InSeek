import React from "react";
import {describe, expect, it, vi} from "vitest";
import {Route, Routes} from "react-router-dom";
import {api} from "../utils/api.js";
import LoginForm from "../components/auth/LoginForm.jsx";
import RegisterForm from "../components/auth/RegisterForm.jsx";
import {fireEvent, renderWithProviders, screen, userEvent, waitFor} from "./test-utils.jsx";

describe("authentication forms", () => {
    it("shows a translated validation message for an invalid login email", async () => {
        renderWithProviders(<LoginForm authChecked user={null}/>);

        fireEvent.change(screen.getByLabelText("Adresse courriel"), {target: {value: "invalid"}});
        fireEvent.blur(screen.getByLabelText("Adresse courriel"));
        fireEvent.submit(screen.getByRole("button", {name: "Se connecter"}).closest("form"));

        expect(await screen.findByText("Courriel invalide")).toBeInTheDocument();
    });

    it("logs in and redirects an employer", async () => {
        const login = vi.spyOn(api.auth, "login").mockResolvedValue(
            new Response(JSON.stringify({accessToken: "token"}), {status: 200}),
        );
        vi.spyOn(api.auth, "getMe").mockResolvedValue(
            new Response(JSON.stringify({role: "ROLE_EMPLOYEUR", nomCompagnie: "NovaLab"}), {status: 200}),
        );
        const setUser = vi.fn();
        const user = userEvent.setup();

        renderWithProviders(
            <Routes>
                <Route path="/login" element={<LoginForm authChecked user={null} setUser={setUser}/>}/>
                <Route path="/employeur" element={<p>Employeur workspace</p>}/>
            </Routes>,
            {route: "/login"},
        );
        await user.type(screen.getByLabelText("Adresse courriel"), "employeur@example.com");
        await user.type(screen.getByLabelText("Mot de passe"), "Password1!");
        await user.click(screen.getByRole("button", {name: "Se connecter"}));

        await waitFor(() => expect(screen.getByText("Employeur workspace")).toBeInTheDocument());
        expect(login).toHaveBeenCalledWith({email: "employeur@example.com", password: "Password1!"});
        expect(setUser).toHaveBeenCalledWith(expect.objectContaining({isLoggedIn: true, role: "ROLE_EMPLOYEUR"}));
    });

    it("reveals the employer field when the employer role is selected", async () => {
        const user = userEvent.setup();
        renderWithProviders(<RegisterForm authChecked user={null}/>);

        await user.click(screen.getByRole("button", {name: "Employeur"}));

        expect(screen.getByLabelText("Nom de l'entreprise")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "S'inscrire"})).toBeDisabled();
    });
});
