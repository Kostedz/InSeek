import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
    fr: {
        translation: {
            brand: {
                tagline: "Trouve ta voie",
            },
            language: {
                switch: "English",
                switchAriaLabel: "Passer à l’anglais",
            },
            navigation: {
                mainAriaLabel: "Navigation principale et actions utilisateur",
                home: "Accueil",
                about: "À propos",
                borrower: "Emprunteur",
                clerk: "Préposé",
                manager: "Gestionnaire",
                closeMenu: "Fermer le menu",
                openMenu: "Ouvrir le menu",
                greeting: "Bonjour {{firstName}} {{lastName}}",
                logout: "Déconnexion",
                login: "Connexion",
                register: "Créer un compte",
                roles: {
                    professeur: "Professeur",
                    etudiant: "Étudiant",
                    employeur: "Employeur",
                    gestionnaire: "Gestionnaire",
                    emprunteur: "Emprunteur",
                    prepose: "Préposé",
                },
            },
            home: {
                title: "Trouvez votre prochaine expérience.",
                description: "InSeek rassemble les étudiants, les employeurs, les gestionnaires de stages et les professeurs pour simplifier la recherche et le suivi des stages.",
                login: "Se connecter",
                register: "Créer un compte",
                studentsTitle: "Pour les étudiants",
                studentsDescription: "Présentez votre profil et découvrez des offres adaptées.",
                employersTitle: "Pour les employeurs",
                employersDescription: "Partagez vos possibilités de stage avec les bons candidats.",
                professorsTitle: "Pour les professeurs",
                professorsDescription: "Suivez les démarches et accompagnez chaque stage.",
            },
            about: {
                label: "À propos",
                description: "InSeek est une plateforme bilingue de gestion des stages qui facilite la collaboration entre les étudiants, les employeurs, les gestionnaires de stages et les professeurs. Elle centralise les CV, les offres, les candidatures et le suivi des stages afin de simplifier chaque étape, de la recherche d’un stage à son évaluation. Grâce à une interface claire et des outils adaptés à chaque rôle, InSeek aide tous les intervenants à rester informés et à avancer efficacement.",
                version: "Version 1.0.0",
                backHome: "Retour à l'accueil",
            },
            auth: {
                memberArea: "Espace membre",
                login: {
                    welcomeBack: "Bon retour.",
                    description: "Connectez-vous pour accéder à votre espace InSeek.",
                    email: "Adresse courriel",
                    emailPlaceholder: "nom@exemple.com",
                    password: "Mot de passe",
                    invalidEmail: "Courriel invalide",
                    invalidPassword: "Mot de passe invalide",
                    submit: "Se connecter",
                    noAccount: "Pas encore de compte ?",
                    createAccount: "Créer un compte",
                },
                register: {
                    title: "Créer un compte",
                    firstName: "Prénom",
                    firstNamePlaceholder: "Pascal",
                    lastName: "Nom",
                    lastNamePlaceholder: "Dupont",
                    email: "Adresse courriel",
                    emailPlaceholder: "nom@exemple.com",
                    password: "Mot de passe",
                    confirmPassword: "Confirmer le mot de passe",
                    programme: "Programme / Discipline",
                    company: "Nom de l'entreprise",
                    companyPlaceholder: "Nom de l'entreprise",
                    submit: "S'inscrire",
                    disciplines: {
                        informatique: "Informatique",
                        infirmiere: "Tech. Infirmière",
                        architecture: "Architecture",
                    },
                    errors: {
                        firstName: "Le prénom doit contenir entre 2 et 30 caractères alphabétiques.",
                        lastName: "Le nom doit contenir entre 2 et 30 caractères alphabétiques.",
                        email: "Adresse courriel invalide. Exemple : example123@example.com",
                        password: "Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 symbole",
                        confirmPassword: "Les mots de passe ne correspondent pas.",
                        companyRequired: "Le nom de l'entreprise est requis.",
                        invalidData: "Données invalides ou courriel déjà utilisé.",
                        unauthorized: "Accès non autorisé.",
                        unavailable: "Serveur non disponible.",
                        submit: "Erreur lors de l'inscription.",
                        userInfo: "Impossible de récupérer les informations de l'utilisateur.",
                    },
                },
            },
            roles: {
                borrower: {
                    label: "Espace emprunteur",
                    title: "Bienvenue dans votre espace.",
                    description: "Retrouvez ici les accès qui correspondent à votre rôle dans InSeek.",
                },
                clerk: {
                    label: "Espace préposé",
                    title: "Un espace pour garder le cap.",
                    description: "Accédez rapidement aux outils associés à votre rôle dans InSeek.",
                },
                manager: {
                    label: "Espace gestionnaire",
                    title: "Tout votre espace au même endroit.",
                    description: "Gérez les accès et vérifiez les ressources réservées à votre rôle.",
                },
                actionLabel: "Action disponible",
                protectedAccessTitle: "Tester un accès protégé",
                protectedAccessDescription: "Vérifiez la réponse de l'endpoint gestionnaire depuis votre session actuelle.",
                protectedAccessButton: "Accéder à l'endpoint gestionnaire",
                forbidden: "Accès refusé : endpoint réservé au gestionnaire (403).",
                apiError: "Erreur API ({{status}})",
            },
            errorPage: {
                label: "Erreur",
                title: "Un problème est survenu",
                unexpected: "Une erreur inattendue est survenue.",
                backHome: "Retour à l'accueil",
            },
            loading: {
                ariaLabel: "Chargement",
                message: "Chargement en cours…",
            },
            footer: {
                copyright: "Copyright © 2026 InSeek",
                about: "À propos",
            },
            errors: {
                forbidden: "Accès interdit",
                notFound: "Rien ici (404)",
                unauthorized: "Non autorisé",
                serverUnavailable: "Serveur non disponible",
                requestFailed: "Échec de la récupération des informations utilisateur",
                requestFailedGeneric: "La requête a échoué",
            },
        },
    },
    en: {
        translation: {
            brand: {
                tagline: "Find your way",
            },
            language: {
                switch: "Français",
                switchAriaLabel: "Switch to French",
            },
            navigation: {
                mainAriaLabel: "Main navigation and user actions",
                home: "Home",
                about: "About",
                borrower: "Borrower",
                clerk: "Clerk",
                manager: "Manager",
                closeMenu: "Close menu",
                openMenu: "Open menu",
                greeting: "Hello {{firstName}} {{lastName}}",
                logout: "Log out",
                login: "Log in",
                register: "Create account",
                roles: {
                    professeur: "Professor",
                    etudiant: "Student",
                    employeur: "Employer",
                    gestionnaire: "Manager",
                    emprunteur: "Borrower",
                    prepose: "Clerk",
                },
            },
            home: {
                title: "Find your next experience.",
                description: "InSeek brings together students, employers, internship managers, and professors to simplify the search for and follow-up of internships.",
                login: "Log in",
                register: "Create account",
                studentsTitle: "For students",
                studentsDescription: "Present your profile and discover opportunities that fit.",
                employersTitle: "For employers",
                employersDescription: "Share your internship opportunities with the right candidates.",
                professorsTitle: "For professors",
                professorsDescription: "Follow each process and support every internship.",
            },
            about: {
                label: "About",
                description: "InSeek is a bilingual internship management platform that makes collaboration between students, employers, internship managers, and professors easier. It centralizes résumés, opportunities, applications, and internship follow-up to simplify every step, from searching for an internship to evaluating it. With a clear interface and tools adapted to each role, InSeek helps everyone stay informed and move forward efficiently.",
                version: "Version 1.0.0",
                backHome: "Back to home",
            },
            auth: {
                memberArea: "Member area",
                login: {
                    welcomeBack: "Welcome back.",
                    description: "Log in to access your InSeek space.",
                    email: "Email address",
                    emailPlaceholder: "name@example.com",
                    password: "Password",
                    invalidEmail: "Invalid email",
                    invalidPassword: "Invalid password",
                    submit: "Log in",
                    noAccount: "Don't have an account yet?",
                    createAccount: "Create account",
                },
                register: {
                    title: "Create account",
                    firstName: "First name",
                    firstNamePlaceholder: "Pascal",
                    lastName: "Last name",
                    lastNamePlaceholder: "Smith",
                    email: "Email address",
                    emailPlaceholder: "name@example.com",
                    password: "Password",
                    confirmPassword: "Confirm password",
                    programme: "Program / Discipline",
                    company: "Company name",
                    companyPlaceholder: "Company name",
                    submit: "Sign up",
                    disciplines: {
                        informatique: "Computer Science",
                        infirmiere: "Nursing Technician",
                        architecture: "Architecture",
                    },
                    errors: {
                        firstName: "The first name must contain between 2 and 30 alphabetic characters.",
                        lastName: "The last name must contain between 2 and 30 alphabetic characters.",
                        email: "Invalid email address. Example: example123@example.com",
                        password: "At least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol",
                        confirmPassword: "Passwords do not match.",
                        companyRequired: "The company name is required.",
                        invalidData: "Invalid data or email already in use.",
                        unauthorized: "Unauthorized access.",
                        unavailable: "Server unavailable.",
                        submit: "An error occurred during registration.",
                        userInfo: "Unable to retrieve user information.",
                    },
                },
            },
            roles: {
                borrower: {
                    label: "Borrower space",
                    title: "Welcome to your space.",
                    description: "Find the access options that match your role in InSeek.",
                },
                clerk: {
                    label: "Clerk space",
                    title: "A space to stay on track.",
                    description: "Quickly access the tools associated with your role in InSeek.",
                },
                manager: {
                    label: "Manager space",
                    title: "Your entire space in one place.",
                    description: "Manage access and check the resources reserved for your role.",
                },
                actionLabel: "Available action",
                protectedAccessTitle: "Test protected access",
                protectedAccessDescription: "Check the manager endpoint response from your current session.",
                protectedAccessButton: "Access manager endpoint",
                forbidden: "Access denied: endpoint reserved for the manager (403).",
                apiError: "API error ({{status}})",
            },
            errorPage: {
                label: "Error",
                title: "Something went wrong",
                unexpected: "An unexpected error occurred.",
                backHome: "Back to home",
            },
            loading: {
                ariaLabel: "Loading",
                message: "Loading…",
            },
            footer: {
                copyright: "Copyright © 2026 InSeek",
                about: "About",
            },
            errors: {
                forbidden: "Access forbidden",
                notFound: "Nothing here (404)",
                unauthorized: "Unauthorized",
                serverUnavailable: "Server unavailable",
                requestFailed: "Failed to retrieve user information",
                requestFailedGeneric: "The request failed",
            },
        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "fr",
        supportedLngs: ["fr", "en"],
        defaultNS: "translation",
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage"],
            caches: ["localStorage"],
        },
    });

if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.resolvedLanguage || "fr";
    i18n.on("languageChanged", (language) => {
        document.documentElement.lang = language;
    });
}

export default i18n;
