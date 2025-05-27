import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { i18n } = useTranslation();
    const location = useLocation();

    const handleLanguageChange = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getTitle = () => {
        switch (i18n.language) {
            case 'en':
                return 'Dambulla Dedicated Economic Center';
            case 'ta':
                return 'தம்புள்ள விசேட பொருளாதார மையம்';
            default:
                return 'දඹුල්ල විශේෂිත ආර්ථික මධ්‍යස්ථානය';
        }
    };

    const navLinkClass = (path) => {
        const isExactMatch = location.pathname === path;
        return `
            relative px-4 py-1 rounded-full transition-all duration-300 
            ${isExactMatch
                ? "bg-gradient-to-r from-lime-300 to-green-400 text-green-900 font-bold shadow-lg shadow-lime-300/60 animate-pulse"
                : "hover:bg-lime-200 hover:text-green-900 text-white"
            }
        `;
    };

    return (
        <div className="sticky top-0 z-50 shadow-lg text-base md:text-lg bg-white">
            {/* Top ribbon */}
            <div className="bg-lime-400 text-gray-900 text-sm md:text-base py-2 px-4 flex justify-between items-center font-medium">
                <div>
                    📢 DDEC Hotline Service: <span className="font-semibold">066 2285181</span>
                </div>
                <div className="space-x-4 flex">
                    <button onClick={() => handleLanguageChange('en')} className="hover:underline">EN</button>
                    <button onClick={() => handleLanguageChange('si')} className="hover:underline">සිං</button>
                    <button onClick={() => handleLanguageChange('ta')} className="hover:underline">தமிழ்</button>
                </div>
            </div>

            {/* Navbar */}
            <nav className="bg-green-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    {/* Logo & title */}
                    <div className="flex items-center space-x-4">
                        <img
                            src="/images/logo.jpg"
                            alt="Gov Logo"
                            className="w-12 h-12 rounded-full border border-white"
                        />
                        <Link to="/" className="text-2xl font-bold tracking-wide text-white leading-tight">
                            {getTitle()}
                        </Link>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden md:flex space-x-6 items-center font-medium text-lg">
                        <Link to="/" className={navLinkClass("/")}>Home</Link>
                        <Link to="/home-dailyprice" className={navLinkClass("/home-dailyprice")}>Daily Price</Link>
                        <Link to="/contact" className={navLinkClass("/contact")}>Contact</Link>
                    </div>

                    {/* Mobile toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isOpen && (
                    <div className="md:hidden px-4 pb-4 space-y-3 font-medium text-white text-base">
                        <Link to="/" className={navLinkClass("/")}>Home</Link>
                        <Link to="/home-dailyprice" className={navLinkClass("/home-dailyprice")}>Daily Price</Link>
                        <Link to="/contact" className={navLinkClass("/contact")}>Contact</Link>
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Navbar;
