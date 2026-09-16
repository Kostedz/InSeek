import React from "react";
import { Link } from 'react-router-dom';
function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-center text-center py-4">
      <p className="text-sm">Copyright &copy; 2026</p>
      <Link to='/about' className="text-sm text-blue-600 underline">About</Link>
    </footer>
  );
}
export default Footer;
