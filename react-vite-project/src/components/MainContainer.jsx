import React from "react";
import { Link } from "react-router-dom";

function MainContainer() {
  return (
    <section className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(48,35,55,0.08)] sm:p-10 lg:p-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className=" text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
            Trouvez votre prochaine expérience.
          </h1>
          <p className="mt-5 text-base leading-8 text-ink-soft sm:text-lg">
            InSeek rassemble les étudiants, les employeurs, les gestionnaires de stages et les professeurs pour simplifier la recherche et le suivi des stages.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-lavender/50 px-5 py-3 text-center text-sm font-bold text-ink transition-colors hover:bg-lavender focus:outline-none focus:ring-4 focus:ring-lavender/60">
              Se connecter
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-white transition-[outline] duration-200 hover:outline-3 hover:outline-pink hover:outline-offset-2 focus:outline-none focus:ring-4 focus:ring-pink/50">
              Créer un compte
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 rounded-[1.5rem] bg-lavender/50 p-5 text-center sm:grid-cols-3 sm:p-6">
          <div className="border-b border-ink/10 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
            <p className="text-sm font-bold text-ink">Pour les étudiants</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Présentez votre profil et découvrez des offres adaptées.</p>
          </div>
          <div className="border-b border-ink/10 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
            <p className="text-sm font-bold text-ink">Pour les employeurs</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Partagez vos possibilités de stage avec les bons candidats.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Pour les professeurs</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Suivez les démarches et accompagnez chaque stage.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MainContainer;
