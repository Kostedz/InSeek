import React from "react";
import { Link } from 'react-router-dom';

function Header({user}) {
    // Function to format role for display (remove ROLE_ prefix and capitalize)
    const formatRole = (roleString) => {
        if (!roleString) return '';
        // Remove ROLE_ prefix if present
        const roleName = roleString.replace('ROLE_', '');
        // Capitalize first letter, lowercase the rest
        return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
    };

    const isGestionnaire = () => {
        console.log(user)
        return user && user.role &&
            (user.role.toString() === 'GESTIONNAIRE');
    }
    const isPrepose = () => {
        console.log(user)
        return user && user.role &&
            (user.role.toString() === 'GESTIONNAIRE' || user.role.toString() === 'PREPOSE');
    }
    const isEmprunteur = () => {
        console.log(user)
        return user && user.role &&
            (user.role.toString() === 'GESTIONNAIRE' || user.role.toString() === 'EMPRUNTEUR');
    }

    return (
        <header className="bg-gray-800 min-h-[60px] flex items-center justify-between text-white px-5 py-3">
            <h1 className="text-lg font-semibold">InSeek</h1>
            <nav className="flex items-center space-x-4">
                <ul className="flex space-x-3 list-none">
                    <li><Link to="/" className="text-white no-underline">Accueil</Link></li>
                    <li><Link to="/about" className="text-white no-underline">À propos</Link></li>
                    {isEmprunteur() && <li><Link to="/emprunteur" className="text-white no-underline">Emprunteur</Link></li>}
                    {isPrepose() && <li><Link to="/prepose" className="text-white no-underline">Prepose</Link></li>}
                    {isGestionnaire() && <li><Link to="/gestionnaire" className="text-white no-underline">Gestionnaire</Link></li>}
                    <li>{user?.isLoggedIn ? <Link to="/logout" className="text-white no-underline">Logout</Link> : <Link to="/login" className="text-white no-underline">Login</Link>}</li>
                    <li>{user?.isLoggedIn ? <Link to="/logout" className="text-white no-underline">Logout</Link> : <Link to="/register" className="text-white no-underline">Register</Link>}</li>
                </ul>

                {user?.isLoggedIn && (
                    <div className="ml-4 text-sm text-right">
                        <p>
                            Bonjour <span className="font-medium">{user.firstName} {user.lastName}</span>
                            {user.role && (
                                <span className="ml-1"> - {formatRole(user.role.toString())}</span>
                            )}
                        </p>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;