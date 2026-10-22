import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Menu, X, ChevronDown, User, Save, Plus, Trash2,
  Paperclip, Mail, Send, KeyRound, LogOut, LogIn, Loader2,
  Cpu, BookText, LibraryBig, Heart,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import mammoth from 'mammoth';
/* ================= Типы ================= */
interface Work {
  id: string;
  title: string;
  description: string;
  date: string;
  fileName?: string;
  fileType?: string;
  filePath?: string;
  content?: string;
}
/* ============ Работы по умолчанию ============ */
const DEFAULT_AI_WORKS: Work[] = [
  {
    id: 'mirror-world',
    title: 'Альтернативная история: Мир Разломанного Зеркала',
    description:
      'Что, если бы история пошла по другому пути? Этот рассказ погружает вас в мир, где одно событие изменило всё.',
    date: '21.10.2026',
    fileName: 'mirror-world.docx',
    filePath: 'mirror-world.docx',
  },
];
/* ============ IndexedDB ============ */
const DB_NAME = 'literatureArchive';
const STORE_NAME = 'files';
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME))
        req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveFile(key: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function loadFile(key: string): Promise<File | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as File | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch { return undefined; }
}
async function deleteStoredFile(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { return; }
}
/* ============ Хелперы ============ */
function getBase(): string {
  const path = window.location.pathname;
  const idx = path.indexOf('/index.html');
  if (idx > 0) return path.slice(0, idx + 1);
  return path.endsWith('/') ? path : path + '/';
}
function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function withIds(list: any[]): Work[] {
  return (list || []).map((w: any, i: number) => ({
    id: w.id || `legacy-${i}-${(w.title || 'work').slice(0, 12)}`,
    title: w.title || 'Без названия',
    description: w.description || '',
    date: w.date || '',
    fileName: w.fileName,
    fileType: w.fileType,
    filePath: w.filePath,
    content: w.content,
  }));
}
/* ============ Единый стиль кнопок ============
   Основная кнопка:  bg-indigo-600 hover:bg-indigo-700 text-white
   Призрачная:       bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white
   Опасная:          bg-red-500/10 hover:bg-red-500/20 text-red-400
   Нейтральная:      bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white
*/
/* ============ Стили читалки ============ */
const readerStyles = `
  .reader-content { color: black !important; }
  .reader-content p { margin-bottom: 1.5em; line-height: 1.8; color: black !important; }
  .reader-content h1, .reader-content h2, .reader-content h3 { font-weight: bold; margin-top: 2em; margin-bottom: 1em; color: black !important; }
  .reader-content h1 { font-size: 2.25rem; }
  .reader-content h2 { font-size: 1.875rem; }
  .reader-content h3 { font-size: 1.5rem; }
  .reader-content strong, .reader-content b { font-weight: 900 !important; color: black !important; }
  .reader-content em, .reader-content i { font-style: italic !important; color: black !important; }
  .reader-content ul, .reader-content ol { margin-left: 1.5rem; margin-bottom: 1.5em; color: black !important; }
  .reader-content ul { list-style-type: disc; }
  .reader-content ol { list-style-type: decimal; }
`;
/* ============ Окно чтения ============ */
function ReaderModal({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!work) return;
    document.body.style.overflow = 'hidden';
    setHtml(''); setError('');
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (work.filePath) {
          try {
            const url = `${getBase()}library/${work.filePath}`.replace(/\/\//g, '/');
            const resp = await fetch(url);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              const out = work.filePath.toLowerCase().endsWith('.docx')
                ? (await mammoth.convertToHtml({ arrayBuffer: buf })).value
                : `<div class="whitespace-pre-wrap">${new TextDecoder().decode(buf).replace(/</g, '&lt;')}</div>`;
              if (!cancelled) setHtml(out);
              return;
            }
          } catch { }
        }
        const local = await loadFile(work.id);
        if (local && !cancelled) {
          const buf = await local.arrayBuffer();
          const nm = (local.name || work.fileName || '').toLowerCase();
          const out = (nm.endsWith('.docx') || nm.endsWith('.doc'))
            ? (await mammoth.convertToHtml({ arrayBuffer: buf })).value
            : `<div class="whitespace-pre-wrap">${new TextDecoder().decode(buf).replace(/</g, '&lt;')}</div>`;
          setHtml(out); return;
        }
        if (work.content && !cancelled) {
          setHtml(`<div class="whitespace-pre-wrap">${work.content.replace(/</g, '&lt;')}</div>`); return;
        }
        if (!cancelled) setError('Файл пока недоступен.');
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Не удалось открыть.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; document.body.style.overflow = ''; };
  }, [work]);
  return (
    <AnimatePresence>
      {work && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-white">
          <style>{readerStyles}</style>
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 truncate">{work.title}</h2>
            {/* Кнопка закрытия */}
            <button onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto px-6 py-12">
              {loading && <div className="flex flex-col items-center py-20 text-gray-400"><Loader2 className="animate-spin mb-4" size={40} /><p>Загрузка...</p></div>}
              {!loading && error && <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600"><p>{error}</p></div>}
              {!loading && !error && html && (
                <div className="reader-content max-w-none text-black text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
/* ============ Секция произведений ============ */
interface SectionProps {
  id: string; title: string; icon: React.ReactNode;
  works: Work[]; isAdmin: boolean;
  onAddWork: (w: Work) => void;
  onDeleteWork: (i: number) => void;
  onReadWork: (w: Work) => void;
}
function WorksSection({ id, title, icon, works, isAdmin, onAddWork, onDeleteWork, onReadWork }: SectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fFile, setFFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) return;
    const nid = `work-${Date.now()}`;
    if (fFile) { try { await saveFile(nid, fFile); } catch { alert('Не удалось сохранить файл.'); return; } }
    onAddWork({ id: nid, title: fTitle.trim(), description: fDesc.trim(), date: new Date().toLocaleDateString('ru-RU'), fileName: fFile?.name, fileType: fFile?.type });
    setFTitle(''); setFDesc(''); setFFile(null); setShowForm(false);
  };
  const remove = async (i: number) => {
    if (!confirm('Удалить это произведение?')) return;
    await deleteStoredFile(works[i].id);
    onDeleteWork(i);
  };
  if (works.length === 0 && !isAdmin) return null;
  return (
    <section id={id} className="py-20 border-b border-white/5 bg-stone-900/50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white">{icon}</div>
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(s => !s)}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20 self-start">
              {showForm ? <X size={20} /> : <Plus size={20} />}
              <span>{showForm ? 'Отмена' : 'Добавить'}</span>
            </button>
          )}
        </div>
        {/* Форма добавления */}
        {isAdmin && showForm && (
          <form onSubmit={submit} className="mb-12 p-8 bg-white/5 border border-indigo-500/30 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Название произведения</label>
                <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Введите название..." required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Файл (PDF, DOCX)</label>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full px-4 py-3 bg-stone-800 border border-white/10 border-dashed rounded-lg text-gray-400 hover:border-indigo-500 hover:text-indigo-300 transition-all flex items-center justify-between gap-2">
                  <span className="truncate">{fFile ? fFile.name : 'Выберите файл...'}</span>
                  <Paperclip size={16} className="shrink-0" />
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                  onChange={e => setFFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Краткое описание</label>
              <textarea value={fDesc} onChange={e => setFDesc(e.target.value)}
                className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                placeholder="О чем это произведение?" rows={3} />
            </div>
            <button type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20">
              Сохранить и загрузить
            </button>
          </form>
        )}
        {/* Карточки */}
        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((w, i) => (
              <div key={w.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h3 className="text-xl font-bold text-white leading-tight">{w.title}</h3>
                  {w.date && <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0 mt-1">{w.date}</span>}
                </div>
                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{w.description}</p>
                {(w.fileName || w.filePath) && (
                  <div className="mb-4 flex items-center space-x-2 text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded w-fit max-w-full">
                    <Paperclip size={12} className="shrink-0" />
                    <span className="truncate max-w-[150px]">{w.fileName || w.filePath}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {/* Кнопка Читать */}
                  <button onClick={() => onReadWork(w)}
                    className="flex-grow py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center space-x-2">
                    <span>Читать</span><BookOpen size={14} />
                  </button>
                  {/* Кнопка Удалить (только автору) */}
                  {isAdmin && (
                    <button onClick={() => remove(i)}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all" title="Удалить">
                      <Trash2 size={16} />
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
}
/* ============ Приложение ============ */
export default function App() {
  const [aiWorks, setAiWorks] = useState<Work[]>(() => withIds(readJSON<any[]>('aiWorks', [])));
  const [stories, setStories] = useState<Work[]>(() => withIds(readJSON<any[]>('personalStories', [])));
  const [books, setBooks] = useState<Work[]>(() => withIds(readJSON<any[]>('personalBooks', [])));
  const [about, setAbout] = useState<string>(() => readJSON<string>('aboutContent', ''));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readJSON<boolean>('isAdmin', false));
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reader, setReader] = useState<Work | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('aiWorks')) setAiWorks(DEFAULT_AI_WORKS);
  }, []);
  useEffect(() => { localStorage.setItem('aiWorks', JSON.stringify(aiWorks)); }, [aiWorks]);
  useEffect(() => { localStorage.setItem('personalStories', JSON.stringify(stories)); }, [stories]);
  useEffect(() => { localStorage.setItem('personalBooks', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('aboutContent', JSON.stringify(about)); }, [about]);
  useEffect(() => { localStorage.setItem('isAdmin', JSON.stringify(isAdmin)); }, [isAdmin]);
  const checkPassword = (): boolean => {
    const stored = localStorage.getItem('authorPassword');
    const entered = prompt('Введите пароль автора:');
    if (entered === null) return false;
    if (stored ? entered === stored : entered === 'author2024') return true;
    alert('Неверный пароль');
    return false;
  };
  const heroUrl = `${getBase()}hero-custom.jpg`.replace(/\/\//g, '/');
  const hasAny = aiWorks.length > 0 || stories.length > 0 || books.length > 0;
  return (
    <div className="min-h-screen bg-stone-900 selection:bg-indigo-500 selection:text-white">
      {/* ===== Навигация ===== */}
      <nav className="sticky top-0 z-40 bg-stone-900/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип / «О себе» */}
            <div className="flex items-center space-x-2 cursor-pointer group"
              onClick={() => { setAboutOpen(o => !o); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <BookOpen size={24} className="text-indigo-400 group-hover:text-white transition-colors" />
              <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                Козлов Константин
              </span>
            </div>
            {/* Десктоп-навигация */}
            <div className="hidden md:flex space-x-8 text-sm font-medium">
              {[
                { href: '#', label: 'Главная' },
                { href: '#ai-stories', label: 'ИИ-Истории' },
                { href: '#my-stories', label: 'Рассказы' },
                { href: '#my-books', label: 'Книги' },
                { href: '#contact', label: 'Контакты' },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
                  {l.label}
                </a>
              ))}
            </div>
            {/* Мобильное меню */}
            <button className="md:hidden text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-stone-900 border-t border-white/5">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {[
                { href: '#', label: 'Главная' },
                { href: '#ai-stories', label: 'ИИ-Истории' },
                { href: '#my-stories', label: 'Рассказы' },
                { href: '#my-books', label: 'Книги' },
                { href: '#contact', label: 'Контакты' },
              ].map(l => (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-all">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main>
        {/* ===== О себе ===== */}
        <AnimatePresence>
          {aboutOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-950 text-white overflow-hidden border-b border-indigo-500/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-600 rounded-xl"><User size={24} /></div>
                    <h2 className="text-3xl font-bold">О себе</h2>
                  </div>
                  {/* Закрыть */}
                  <button onClick={() => setAboutOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <X size={28} />
                  </button>
                </div>
                <div className="max-w-3xl mx-auto">
                  {isAdmin ? (
                    <div className="space-y-6">
                      <textarea id="about-textarea" defaultValue={about}
                        className="w-full h-64 px-4 py-3 bg-white/5 border border-indigo-500/30 rounded-xl text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-light leading-relaxed text-lg"
                        placeholder="Расскажите о себе..." />
                      {/* Сохранить */}
                      <button onClick={() => {
                        const el = document.getElementById('about-textarea') as HTMLTextAreaElement | null;
                        if (el) { setAbout(el.value); alert('Данные сохранены!'); }
                      }}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20">
                        <Save size={20} /><span>Сохранить изменения</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 text-gray-300 text-lg leading-relaxed font-light">
                      {about
                        ? about.split('\n').map((p, i) => <p key={i}>{p}</p>)
                        : <p className="italic text-gray-500">Информация будет добавлена в ближайшее время.</p>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* ===== Герой ===== */}
        <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${heroUrl}')` }}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Литературное хранилище</h1>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {(aiWorks.length > 0 || isAdmin) && (
                <a href="#ai-stories"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20">
                  ИИ-истории
                </a>
              )}
              {(stories.length > 0 || isAdmin) && (
                <a href="#my-stories"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold transition-all backdrop-blur-sm">
                  Рассказы
                </a>
              )}
              {(books.length > 0 || isAdmin) && (
                <a href="#my-books"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold transition-all backdrop-blur-sm">
                  Книги
                </a>
              )}
            </div>
          </div>
          <motion.a href="#ai-stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white animate-bounce transition-colors cursor-pointer">
            <ChevronDown size={32} />
          </motion.a>
        </section>
        {/* ===== Секции произведений ===== */}
        <WorksSection id="ai-stories" title="ИИ-истории" icon={<Cpu size={28} />}
          works={aiWorks} isAdmin={isAdmin}
          onAddWork={w => setAiWorks(p => [w, ...p])}
          onDeleteWork={i => setAiWorks(p => p.filter((_, x) => x !== i))}
          onReadWork={setReader} />
        <WorksSection id="my-stories" title="Мои собственные рассказы" icon={<BookText size={28} />}
          works={stories} isAdmin={isAdmin}
          onAddWork={w => setStories(p => [w, ...p])}
          onDeleteWork={i => setStories(p => p.filter((_, x) => x !== i))}
          onReadWork={setReader} />
        <WorksSection id="my-books" title="Мои собственные книги" icon={<LibraryBig size={28} />}
          works={books} isAdmin={isAdmin}
          onAddWork={w => setBooks(p => [w, ...p])}
          onDeleteWork={i => setBooks(p => p.filter((_, x) => x !== i))}
          onReadWork={setReader} />
        {/* ===== Контакты ===== */}
        <section id="contact" className="py-24 bg-stone-50 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Контактная информация */}
                <div className="p-12 lg:p-16 bg-indigo-900 text-white">
                  <h2 className="text-4xl font-serif font-bold mb-6">Связаться со мной</h2>
                  <p className="text-indigo-200 mb-12 text-lg">
                    Будь вы читателем, коллегой-писателем или заинтересованы в сотрудничестве, я буду рад вашему сообщению.
                  </p>
                  <div className="space-y-8">
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300 shrink-0">
                        <Mail size={22} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Email</h4>
                        <p className="text-xl break-all">kostya.kozlov280.dmit@gmail.com</p>
                      </div>
                    </div>
                    <a href="https://t.me/kkmrdr" target="_blank" rel="noopener noreferrer"
                      className="flex items-center space-x-6 group hover:bg-indigo-800/50 p-2 -m-2 rounded-xl transition-all">
                      <div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                        <Send size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Telegram</h4>
                        <p className="text-xl">@kkmrdr</p>
                      </div>
                    </a>
                  </div>
                </div>
                {/* Форма */}
                <div className="p-12 lg:p-16">
                  <form className="space-y-6" onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    window.location.href = `mailto:kostya.kozlov280.dmit@gmail.com?subject=${encodeURIComponent(String(fd.get('subject') || 'Сообщение с сайта'))}&body=${encodeURIComponent(`Имя: ${fd.get('name')}\nEmail: ${fd.get('email')}\n\n${fd.get('message')}`)}`;
                  }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                        <input name="name" type="text" placeholder="Иван Иванов"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input name="email" type="email" placeholder="ivan@example.com"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Тема</label>
                      <input name="subject" type="text" placeholder="Общий запрос"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение</label>
                      <textarea name="message" rows={5} placeholder="Ваше сообщение здесь..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" />
                    </div>
                    {/* Кнопка отправить */}
                    <button type="submit"
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20">
                      <Send size={18} /><span>Отправить сообщение</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* ===== Подвал ===== */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <span className="text-2xl font-serif font-bold text-indigo-900 tracking-tight">
                  Литературное хранилище
                </span>
              </div>
              <p className="text-gray-500 max-w-sm mb-6">
                Персональное хранилище литературных трудов и ИИ-экспериментов.
              </p>
            </div>
            {(hasAny || isAdmin) && (
              <div>
                <h4 className="text-gray-900 font-bold mb-6">Навигация</h4>
                <ul className="space-y-4">
                  {[
                    { href: '#', label: 'Главная' },
                    { href: '#ai-stories', label: 'ИИ-Истории' },
                    { href: '#my-stories', label: 'Рассказы' },
                    { href: '#my-books', label: 'Книги' },
                  ].map(l => (
                    <li key={l.label}>
                      <a href={l.href} className="text-gray-500 hover:text-indigo-600 transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 flex-wrap justify-center gap-y-2">
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Козлов Константин. Все права защищены.</p>
              {isAdmin ? (
                <div className="flex items-center space-x-2">
                  {/* Сменить пароль */}
                  <button onClick={() => {
                    const np = prompt('Введите новый пароль:');
                    if (np) { localStorage.setItem('authorPassword', np); alert('Пароль успешно изменен!'); }
                  }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-all text-sm font-bold flex items-center gap-1">
                    <KeyRound size={14} /><span>Сменить пароль</span>
                  </button>
                  {/* Выход */}
                  <button onClick={() => setIsAdmin(false)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-all flex items-center space-x-2 text-sm font-bold border border-red-500/20">
                    <LogOut size={16} /><span>Выход</span>
                  </button>
                </div>
              ) : (
                /* Вход для автора */
                <button onClick={() => { if (checkPassword()) setIsAdmin(true); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all flex items-center space-x-2 text-sm font-bold shadow-lg shadow-indigo-600/30">
                  <LogIn size={16} /><span>Вход для автора</span>
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm flex items-center">
              Сделано с <Heart size={14} className="mx-1 text-red-400 fill-current" /> для любителей литературы.
            </p>
          </div>
        </div>
      </footer>
      {/* Читалка */}
      <ReaderModal work={reader} onClose={() => setReader(null)} />
    </div>
  );
}