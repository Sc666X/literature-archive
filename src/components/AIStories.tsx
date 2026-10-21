import { motion } from 'framer-motion';
import { Cpu, Sparkles, Zap, Stars } from 'lucide-react';

const AIStories = () => {
  return (
    <section id="ai-stories" className="py-24 bg-gradient-to-b from-stone-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-2 text-indigo-400 mb-4">
              <Sparkles size={20} />
              <span className="uppercase tracking-[0.3em] text-sm font-bold">Новые горизонты</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              ИИ-Истории: Создание <br />
              <span className="text-indigo-400 italic">Синтетической Вселенной</span>
            </h2>
            <div className="w-20 h-1 bg-indigo-500 mb-8"></div>
            
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Я верю, что будущее литературы лежит в синтезе человеческой души и машинной логики. Мой проект «ИИ-Истории» — это экспериментальная инициатива, в которой я использую нейронные сети для соавторства в создании расширяющейся мультивселенной.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                  <Cpu size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Совместное повествование</h4>
                  <p className="text-gray-400 text-sm italic">Слияние моей прозы с бесконечными перестановками логики ИИ.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                  <Stars size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Динамическое мироустройство</h4>
                  <p className="text-gray-400 text-sm italic">Вселенная, развивающаяся на основе математических моделей и повествовательной энтропии.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Алгоритмическая судьба</h4>
                  <p className="text-gray-400 text-sm italic">Персонажи, чьи судьбы просчитаны, но при этом кажутся глубоко человечными.</p>
                </div>
              </div>
            </div>

            <button className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold hover:bg-indigo-50 transition-all flex items-center space-x-2">
              <span>Войти в Мультивселенную</span>
              <Stars size={18} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="/ai-universe.jpg" 
                alt="AI Synthetic Universe" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-indigo-200 font-serif italic text-lg leading-relaxed">
                  «В пространстве между кодом и чернилами рождается новая магия».
                </p>
              </div>
            </div>
            
            {/* Holographic decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIStories;
