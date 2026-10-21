import { BookOpen, Heart, Lock, LogOut } from 'lucide-react';

interface FooterProps {
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
  hasAnyContent: boolean;
}

const Footer = ({ isAdmin, onLogin, onLogout, onChangePassword, hasAnyContent }: FooterProps) => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-serif font-bold text-indigo-900 tracking-tight">
                Козлов Константин
              </span>
            </div>
            <p className="text-gray-500 max-w-sm mb-6">
              Персональное хранилище литературных трудов и ИИ-экспериментов.
            </p>
          </div>

          {(hasAnyContent || isAdmin) && (
            <div>
              <h4 className="text-gray-900 font-bold mb-6">Навигация</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Главная</a></li>
                <li><a href="#ai-stories" className="text-gray-500 hover:text-indigo-600 transition-colors">ИИ-Истории</a></li>
                <li><a href="#my-stories" className="text-gray-500 hover:text-indigo-600 transition-colors">Рассказы</a></li>
                <li><a href="#my-books" className="text-gray-500 hover:text-indigo-600 transition-colors">Книги</a></li>
              </ul>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Козлов Константин. Все права защищены.
            </p>
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={onChangePassword}
                  className="px-4 py-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-full transition-all text-sm font-bold"
                >
                  Сменить пароль
                </button>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full transition-all flex items-center space-x-2 text-sm font-bold border border-red-500/20"
                >
                  <LogOut size={16} />
                  <span>Выход</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all flex items-center space-x-2 text-sm font-bold shadow-lg shadow-indigo-600/30"
              >
                <Lock size={16} />
                <span>Вход для автора</span>
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm flex items-center">
            Сделано с <Heart size={14} className="mx-1 text-red-400 fill-current" /> для любителей литературы.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
