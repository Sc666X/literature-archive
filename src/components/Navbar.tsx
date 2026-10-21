import { useState, useEffect } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  hasAi: boolean;
  hasStories: boolean;
  hasBooks: boolean;
}

interface NavbarProps {
  isAdmin: boolean;
  hasAi: boolean;
  hasStories: boolean;
  hasBooks: boolean;
  onAboutClick: () => void;
}

const Navbar = ({ isAdmin, hasAi, hasStories, hasBooks, onAboutClick }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Главная', href: '#' },
    (hasAi || isAdmin) && { name: 'ИИ-Истории', href: '#ai-stories' },
    (hasStories || isAdmin) && { name: 'Рассказы', href: '#my-stories' },
    (hasBooks || isAdmin) && { name: 'Книги', href: '#my-books' },
    { name: 'Контакты', href: '#contact' },
  ].filter(Boolean) as { name: string, href: string }[];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div 
            onClick={onAboutClick}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <BookOpen className={`h-8 w-8 transition-colors ${isScrolled ? 'text-indigo-900' : 'text-white group-hover:text-indigo-300'}`} />
            <span className={`text-2xl font-serif font-bold tracking-tight transition-colors ${isScrolled ? 'text-indigo-900' : 'text-white group-hover:text-indigo-300'}`}>
              Козлов Константин
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-indigo-500 ${isScrolled ? 'text-gray-700' : 'text-white/90'}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${isScrolled ? 'text-gray-900' : 'text-white'} hover:text-indigo-500 transition-colors`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-full left-0 w-full animate-in slide-in-from-top-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
