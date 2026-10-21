import { ExternalLink, Plus, FileUp, X } from 'lucide-react';
import { useState, useRef } from 'react';

export interface Work {
  title: string;
  description: string;
  fileType?: string;
  fileName?: string;
  date?: string;
}

interface LiteratureSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  works: Work[];
  onAddWork: (work: Work) => void;
  onDeleteWork: (index: number) => void;
  isAdmin: boolean;
}

const LiteratureSection = ({ id, title, icon, works, onAddWork, onDeleteWork, isAdmin }: LiteratureSectionProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newWork, setNewWork] = useState<Work>({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWork.title) return;

    onAddWork({
      ...newWork,
      fileType: selectedFile?.type,
      fileName: selectedFile?.name,
      date: new Date().toLocaleDateString('ru-RU')
    });

    setNewWork({ title: '', description: '' });
    setSelectedFile(null);
    setIsAdding(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (works.length === 0 && !isAdmin) return null;

  return (
    <section id={id} className="py-20 border-b border-white/5 bg-stone-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white">
              {icon}
            </div>
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              {isAdding ? <X size={20} /> : <Plus size={20} />}
              <span>{isAdding ? 'Отмена' : 'Добавить'}</span>
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-12 p-8 bg-white/5 border border-indigo-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Название произведения</label>
                <input 
                  type="text" 
                  required
                  value={newWork.title}
                  onChange={(e) => setNewWork({...newWork, title: e.target.value})}
                  className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Введите название..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Файл (PDF, DOCX)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-stone-800 border border-white/10 border-dashed rounded-lg text-gray-400 cursor-pointer hover:border-indigo-500/50 transition-all flex items-center justify-between"
                >
                  <span className="truncate">{selectedFile ? selectedFile.name : 'Выберите файл...'}</span>
                  <FileUp size={18} />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Краткое описание</label>
              <textarea 
                value={newWork.description}
                onChange={(e) => setNewWork({...newWork, description: e.target.value})}
                className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                placeholder="О чем это произведение?"
                rows={3}
              ></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all">
              Сохранить и загрузить
            </button>
          </form>
        )}

        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((work, index) => (
              <div 
                key={index}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-indigo-500/50 transition-all flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">{work.title}</h3>
                  {work.date && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {work.date}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                  {work.description}
                </p>
                {work.fileName && (
                  <div className="mb-4 flex items-center space-x-2 text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded w-fit">
                    <FileUp size={12} />
                    <span className="truncate max-w-[150px]">{work.fileName}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="flex-grow py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2">
                    <span>Читать</span>
                    <ExternalLink size={14} />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => onDeleteWork(index)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isAdmin && (
          <div className="py-20 px-6 border border-dashed border-white/10 rounded-3xl text-center bg-white/[0.02]">
            <p className="text-gray-500 text-lg">Секция пуста</p>
            <p className="text-gray-600 text-sm mt-2">Используйте кнопку «Добавить», чтобы загрузить ваше первое произведение.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LiteratureSection;
