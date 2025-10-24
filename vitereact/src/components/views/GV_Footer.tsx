import React from 'react';
import { Link } from 'react-router-dom';

const GV_Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fixed w-full bottom-0 left-0 z-50 bg-white shadow-lg border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 lg:py-16">
          {/* Quick Links Section */}
          <div className="text-gray-900">
            <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-blue-600 transition-colors block"
                >
                  About
                </Link>
              </li>
              <li>
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-blue-600 transition-colors block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms-of-service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-blue-600 transition-colors block"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div className="text-gray-900">
            <h3 className="text-xl font-semibold mb-6">Follow Us</h3>
            <div className="space-y-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                <span>Instagram</span>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                <span>Twitter</span>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-700 rounded-full"></div>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="text-gray-600 text-sm text-center border-t border-gray-200 py-4">
          &copy; {currentYear} eco11. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default GV_Footer;
