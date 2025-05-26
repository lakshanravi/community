import React from 'react';

const Footer = () => {
    return (
        <footer
            className="bg-green-700 text-white py-10 mt-auto"
            style={{ position: 'relative', bottom: '0', width: '100%' }}
        >
            <div className="container mx-auto px-4">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-lime-100">
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Office Details</h4>
                        <p>Cristy Wijerathna</p>
                        <p>Manager</p>
                        <p>Management Office</p>
                        <p>Dedicated Economic Center</p>
                        <p>Dambulla</p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-2">General Inquiries</h4>
                        <p>📞 Phone: <a href="tel:0662285181" className="hover:text-white">066 2285181</a></p>
                        <p>📧 Email: <a href="mailto:dambulladec@gmail.com" className="hover:text-white">dambulladec@gmail.com</a></p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Follow Us</h4>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/100027588023825" target="_blank" rel="noopener noreferrer" className="hover:text-white text-2xl">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-2xl">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-2xl">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white text-2xl">
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-lime-200 pt-4 text-center text-lime-100 text-sm">
                    &copy; {new Date().getFullYear()} Dambulla Economic Center. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
