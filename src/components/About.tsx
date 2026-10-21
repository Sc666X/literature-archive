import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  content: string;
  onSave: (newContent: string) => void;
}

const About = ({ isOpen, onClose, isAdmin, content, onSave }: AboutProps) => {
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-indigo-950 text-white overflow-hidden border-b border-indigo-500/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-600 rounded-xl text-white">
                  <User size={24} />
                </div>
                <h2 className="text-3xl font-bold">О себе</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="max-w-3xl mx-auto">
              {isAdmin ? (
                <div className="space-y-6">
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 px-4 py-3 bg-white/5 border border-indigo-500/30 rounded-xl text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-light leading-relaxed text-lg"
                    placeholder="Расскажите о себе..."
                  ></textarea>
                  <button 
                    onClick={() => onSave(editContent)}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Save size={20} />
                    <span>Сохранить изменения</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-gray-300 text-lg leading-relaxed font-light">
                  {content ? (
                    content.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p className="italic text-gray-500">Информация будет добавлена в ближайшее время.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default About;
