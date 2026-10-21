import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Globe, BookOpen } from 'lucide-react';

const stories = [
  {
    title: "Кремниевое семя",
    universe: "Стеклянная Мультивселенная",
    excerpt: "Звезды не мерцали; они пульсировали в 64-битных ритмах. Когда первый биологический человек вошел в поток данных, вселенная не сломалась — она произвела расчет.",
    status: "Свежий релиз",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Эхо мертвого облака",
    universe: "Архив-7",
    excerpt: "В остатках старого интернета призрак детского смеха застрял в рекурсивной петле на три столетия. Затем его нашел ИИ.",
    status: "Завершено",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Алгоритм судьбы",
    universe: "Стеклянная Мультивселенная",
    excerpt: "Каждый сделанный нами выбор был переменной в космическом уравнении, о решении которого мы и не подозревали. Сегодня результат наконец был получен.",
    status: "В процессе",
    color: "from-amber-500 to-orange-500"
  }
];

const StoryFeed = () => {
  return (
    <section id="story-feed" className="py-24 bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Zap size={18} />
              <span className="uppercase tracking-widest text-xs font-bold">Эксклюзивный контент</span>
            </div>
            <h2 className="text-4xl font-serif font-bold">Лента ИИ-историй</h2>
            <div className="w-20 h-1 bg-indigo-500 mt-4 mb-6"></div>
            <p className="text-gray-400 max-w-xl">
              Эти истории создаются и публикуются исключительно здесь. Их нет на LitRes, Amazon или любой другой традиционной платформе. Добро пожаловать на передний край моей синтетической вселенной.
            </p>
          </div>
          <div className="flex space-x-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center space-x-2">
              <Globe size={14} className="text-indigo-400" />
              <span>Вселенная: Все</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/[0.08] transition-all duration-500"
            >
              {/* Glowing accent */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${story.color}`}></div>
              
              <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-white/5">
                      {story.status}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">/ {story.universe}</span>
                  </div>
                  <h3 className="text-3xl font-serif font-bold mb-4 group-hover:text-indigo-300 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-300 text-lg italic leading-relaxed mb-6 font-light">
                    «{story.excerpt}»
                  </p>
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-white font-bold hover:text-indigo-400 transition-colors group/btn">
                      <span>Читать полностью</span>
                      <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors">
                      <BookOpen size={16} />
                      <span className="text-sm font-medium">В библиотеку</span>
                    </button>
                  </div>
                </div>
                
                {/* Visual Placeholder for Story Art */}
                <div className="w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center relative overflow-hidden shrink-0">
                   <Sparkles className="text-indigo-500/20" size={64} />
                   <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${story.color}`}></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold transition-all shadow-lg shadow-indigo-600/20">
            Загрузить еще
          </button>
        </div>
      </div>
    </section>
  );
};

export default StoryFeed;
