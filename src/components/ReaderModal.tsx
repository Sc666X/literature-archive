import { useEffect, useState } from 'react';
import { X, Loader2, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import mammoth from 'mammoth';
import { Work } from '../types';
import { loadFile } from '../lib/fileStore';
interface ReaderModalProps {
  work: Work | null;
  onClose: () => void;
}
export function ReaderModal({ work, onClose }: ReaderModalProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!work) return;
    document.body.style.overflow = 'hidden';
    setHtml('');
    setError('');
    (async () => {
      setLoading(true);
      try {
        // 1. Сначала пробуем загрузить файл из репозитория (для посетителей)
        if (work.filePath) {
          const base = import.meta.env.BASE_URL ?? '/';
          const url = `${base}library/${work.filePath}`.replace(/\/\//g, '/');
          const response = await fetch(url);
          
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (work.filePath.toLowerCase().endsWith('.docx')) {
              const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
              setHtml(result.value);
            } else {
              const text = new TextDecoder().decode(buffer);
              setHtml(`<div class="whitespace-pre-wrap">${text}</div>`);
            }
            return;
          }
        }
        // 2. Если файла в репо нет, пробуем загрузить из локального хранилища (для автора)
        const localFile = await loadFile(work.id);
        if (localFile) {
          const buffer = await localFile.arrayBuffer();
          if (localFile.name.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            setHtml(result.value);
          } else {
            const text = new TextDecoder().decode(buffer);
            setHtml(`<div class="whitespace-pre-wrap">${text}</div>`);
          }
          return;
        }
        // 3. Если ничего не сработало, но есть текстовое содержимое
        if (work.content) {
          setHtml(`<div class="whitespace-pre-wrap">${work.content}</div>`);
          return;
        }
        throw new Error('Файл не найден. Если вы посетитель, значит автор еще не загрузил файл в репозиторий GitHub.');
      } catch (e: any) {
        setError(e.message || 'Ошибка при чтении файла');
      } finally {
        setLoading(false);
      }
    })();
    return () => { document.body.style.overflow = ''; };
  }, [work]);
  return (
    <AnimatePresence>
      {work && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-stone-950"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-stone-900/80 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white truncate max-w-xl">{work.title}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-stone-900">
            <div className="max-w-3xl mx-auto px-6 py-12 text-gray-200">
              {loading && (
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                  <p>Загрузка текста...</p>
                </div>
              )}
              {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <p>{error}</p>
                </div>
              )}
              {!loading && !error && html && (
                <div 
                  className="prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: html }} 
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}