import { Link } from 'react-router-dom';
import { Sparkles, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-pink-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-400 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                GlowLink
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Connecting beauty specialists with clients. Find your perfect beauty professional today.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-pink-50 hover:bg-pink-100 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4 text-pink-500" />
              </a>
              <a href="#" className="w-8 h-8 bg-pink-50 hover:bg-pink-100 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4 text-pink-500" />
              </a>
              <a href="#" className="w-8 h-8 bg-pink-50 hover:bg-pink-100 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4 text-pink-500" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Platform</h4>
            <ul className="space-y-2">
              {['Find Specialists', 'How It Works', 'Pricing', 'Blog'].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-500 hover:text-pink-500 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map(link => (
                <li key={link}>
                  <a href="#" className="text-gray-500 hover:text-pink-500 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-pink-100 mt-8 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} GlowLink. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
