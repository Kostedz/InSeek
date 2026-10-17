import React from "react";
import {I18nextProvider} from "react-i18next";
import {MemoryRouter} from "react-router-dom";
import {render} from "@testing-library/react";
import i18n from "../i18n/index.js";

export function renderWithProviders(ui, {route = "/", entries} = {}) {
    i18n.changeLanguage("fr");

    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={entries ?? [route]}>
                {ui}
            </MemoryRouter>
        </I18nextProvider>,
    );
}

export {screen, waitFor, within, fireEvent} from "@testing-library/react";
export {default as userEvent} from "@testing-library/user-event";
