import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  isAdmin: boolean;
  hasAi: boolean;
  hasStories: boolean;
  hasBooks: boolean;
}

const Hero = ({ isAdmin, hasAi, hasStories, hasBooks }: HeroProps) => {
  return (
    <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-custom.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Литературное хранилище
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {(hasAi || isAdmin) && (
            <a 
              href="#ai-stories" 
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              ИИ-истории
            </a>
          )}
          {(hasStories || isAdmin) && (
            <a 
              href="#my-stories" 
              className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Рассказы
            </a>
          )}
          {(hasBooks || isAdmin) && (
            <a 
              href="#my-books" 
              className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Книги
            </a>
          )}
        </div>
      </div>

      <motion.a 
        href="#contact"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 animate-bounce hover:text-white transition-colors cursor-pointer"
      >
        <ChevronDown size={32} />
      </motion.a>
    </section>
  );
};

export default Hero;
