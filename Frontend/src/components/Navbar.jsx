import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { i18n } = useTranslation();

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

    return (
        <div className="sticky top-0 z-50 shadow-lg text-base md:text-lg bg-white">
            {/* Top ribbon bar */}
            <div className="bg-lime-400 text-gray-900 text-sm md:text-base py-2 px-4 flex justify-between items-center font-medium">
                <div>
                    📢 DDEC Hotline Service: <span className="font-semibold"> 066 2285181</span>
                </div>
                <div className="space-x-4 flex">
                    <button onClick={() => handleLanguageChange('en')} className="hover:underline">EN</button>
                    <button onClick={() => handleLanguageChange('si')} className="hover:underline">සිං</button>
                    <button onClick={() => handleLanguageChange('ta')} className="hover:underline">தமிழ்</button>
                </div>
            </div>

            {/* Main navbar */}
            <nav className="bg-green-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    {/* Logo and title */}
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
                    <div className="hidden md:flex space-x-8 items-center font-medium text-lg">
                        <Link to="/" className="hover:text-lime-300">Home</Link>
                        <Link to="/home-dailyprice" className="hover:text-lime-300">Daily Price</Link>
                        <Link to="/contact" className="hover:text-lime-300">Contact</Link>
                        {/* <Link
                            to="/login"
                            className="bg-white text-green-800 px-5 py-2 rounded-full hover:bg-lime-200 font-semibold transition"
                        >
                            Login
                        </Link> */}
                    </div>

                    {/* Mobile menu toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2"
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isOpen && (
                    <div className="md:hidden px-4 pb-4 space-y-3 font-medium text-white text-base">
                        <Link to="/" className="block hover:text-lime-300">Home</Link>
                        <Link to="/home-dailyprice" className="block hover:text-lime-300">Daily Price</Link>
                        <Link to="/contact" className="block hover:text-lime-300">Contact</Link>
                        {/* <Link
                            to="/login"
                            className="block bg-white text-green-800 text-center px-4 py-2 rounded-full font-semibold mt-2 hover:bg-lime-200"
                        >
                            Login
                        </Link> */}
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Navbar;
