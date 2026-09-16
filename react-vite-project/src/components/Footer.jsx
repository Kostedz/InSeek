import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-6 text-center sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-sm text-ink-soft sm:flex-row">
        <p>Copyright &copy; 2026 InSeek</p>
        <Link
          to="/about"
          className="font-semibold text-ink underline decoration-pink decoration-2 underline-offset-4 transition-colors hover:text-ink-soft"
        >
          À propos
        </Link>
      </div>
    </footer>
  );
}
export default Footer;
