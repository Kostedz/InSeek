import React from "react";
import { Link } from 'react-router-dom';

function About() {
  return (
    <section className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10">
        <span className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">À propos</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">InSeek</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft">
          InSeek est une plateforme bilingue de gestion des stages qui facilite la collaboration entre les étudiants, les employeurs, les gestionnaires de stages et les professeurs. Elle centralise les CV, les offres, les candidatures et le suivi des stages afin de simplifier chaque étape, de la recherche d’un stage à son évaluation. Grâce à une interface claire et des outils adaptés à chaque rôle, InSeek aide tous les intervenants à rester informés et à avancer efficacement.
        </p>
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
          <span className="font-semibold text-ink-soft">Version 1.0.0</span>
          <Link to='/' className="font-bold text-ink underline decoration-pink decoration-2 underline-offset-4 hover:text-ink-soft">Retour à l'accueil</Link>
        </div>
      </div>
    </section>
  );

}
export default About;
