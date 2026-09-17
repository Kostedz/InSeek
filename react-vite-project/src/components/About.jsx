import React from "react";
import { Link } from 'react-router-dom';

function About() {
  return (
    <section className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10">
        <span className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">À propos</span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink">InSeek</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-ink-soft">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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
