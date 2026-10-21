import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Menu, X, ChevronDown, User, Save, Plus, Trash2,
  Paperclip, Mail, Send, KeyRound, LogOut, LogIn, Loader2,
  Download, Cpu, BookText, LibraryBig, Heart,
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

/* ============ Хранилище (IndexedDB) ============ */

const DB_NAME = 'literatureArchive';
const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
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

/* ============ Окно чтения (СВЕТЛАЯ ТЕМА С ЧЕРНЫМ ТЕКСТОМ) ============ */

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

function ReaderModal({ work, onClose }: { work: Work | null; onClose: () => void }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!work) return;
    document.body.style.overflow = 'hidden';
    setHtml('');
    setError('');
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
              let out: string;
              if (work.filePath.toLowerCase().endsWith('.docx')) {
                const r = await mammoth.convertToHtml({ arrayBuffer: buf });
                out = r.value;
              } else {
                const txt = new TextDecoder('utf-8').decode(buf);
                out = `<div class="whitespace-pre-wrap">${txt.replace(/</g, '&lt;')}</div>`;
              }
              if (!cancelled) setHtml(out);
              return;
            }
          } catch { }
        }
        const local = await loadFile(work.id);
        if (local && !cancelled) {
          const buf = await local.arrayBuffer();
          const nm = (local.name || work.fileName || '').toLowerCase();
          let out: string;
          if (nm.endsWith('.docx') || nm.endsWith('.doc')) {
            const r = await mammoth.convertToHtml({ arrayBuffer: buf });
            out = r.value;
          } else {
            const txt = new TextDecoder('utf-8').decode(buf);
            out = `<div class="whitespace-pre-wrap">${txt.replace(/</g, '&lt;')}</div>`;
          }
          setHtml(out);
          return;
        }
        if (work.content && !cancelled) {
          setHtml(`<div class="whitespace-pre-wrap">${work.content.replace(/</g, '&lt;')}</div>`);
          return;
        }
        if (!cancelled) setError('Файл не найден на сервере.');
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Ошибка открытия.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, [work]);

  const handleDownload = async () => {
    if (!work) return;
    if (work.filePath) {
      const a = document.createElement('a');
      a.href = `${getBase()}library/${work.filePath}`.replace(/\/\//g, '/');
      a.download = work.filePath;
      a.click();
      return;
    }
    const f = await loadFile(work.id);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name || 'document.docx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <AnimatePresence>
      {work && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-white"
        >
          <style>{readerStyles}</style>
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 truncate">{work.title}</h2>
            <div className="flex items-center gap-2">
              {(work.filePath || work.fileName) && (
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
                  <Download size={16} /> Скачать
                </button>
              )}
              <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><X size={24} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto px-6 py-12">
              {loading && <div className="flex flex-col items-center py-20 text-gray-400"><Loader2 className="animate-spin mb-4" size={40} /><p>Загрузка...</p></div>}
              {!loading && error && <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600"><p>{error}</p></div>}
              {!loading && !error && html && (
                <div className="reader-content max-w-none text-black text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============ Секция произведений ============ */

function WorksSection({ id, title, icon, works, isAdmin, onAddWork, onDeleteWork, onReadWork }: any) {
  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fFile, setFFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) return;
    const nid = `work-${Date.now()}`;
    if (fFile) await saveFile(nid, fFile);
    onAddWork({
      id: nid,
      title: fTitle.trim(),
      description: fDesc.trim(),
      date: new Date().toLocaleDateString('ru-RU'),
      fileName: fFile ? fFile.name : undefined,
    });
    setFTitle(''); setFDesc(''); setFFile(null); setShowForm(false);
  };

  if (works.length === 0 && !isAdmin) return null;

  return (
    <section id={id} className="py-20 border-b border-white/5 bg-stone-900/50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white">{icon}</div>
            <h2 className="text-3xl font-bold text-white">{title}</h2>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold">
              {showForm ? 'Отмена' : 'Добавить'}
            </button>
          )}
        </div>
        {isAdmin && showForm && (
          <form onSubmit={submit} className="mb-12 p-8 bg-white/5 border border-indigo-500/30 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)} className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white" placeholder="Название..." required />
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full px-4 py-3 bg-stone-800 border border-white/10 border-dashed rounded-lg text-gray-400">
                {fFile ? fFile.name : 'Выбрать файл...'}
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => setFFile(e.target.files?.[0] ?? null)} />
            </div>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-lg text-white mb-6" placeholder="Описание..." rows={3} />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold">Сохранить</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((w: Work, i: number) => (
            <div key={w.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full group">
              <div className="flex justify-between mb-4 gap-2">
                <h3 className="text-xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">{w.title}</h3>
                <span className="text-[10px] text-gray-500 uppercase shrink-0">{w.date}</span>
              </div>
              <p className="text-gray-400 text-sm mb-6 flex-grow">{w.description}</p>
              <div className="flex gap-2">
                <button onClick={() => onReadWork(w)} className="flex-grow py-3 bg-indigo-600/10 text-indigo-300 rounded-lg text-sm font-semibold">Читать</button>
                {isAdmin && <button onClick={() => onDeleteWork(i)} className="p-3 bg-red-500/10 text-red-400 rounded-lg"><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ ПРИЛОЖЕНИЕ ============ */

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

  const heroUrl = `${getBase()}hero-custom.jpg`.replace(/\/\//g, '/');

  return (
    <div className="min-h-screen bg-stone-900 selection:bg-indigo-500 text-white">
      <nav className="sticky top-0 z-40 bg-stone-900/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setAboutOpen(!aboutOpen); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <BookOpen size={24} className="text-indigo-400" /><span className="font-bold">Козлов Константин</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#" className="text-gray-400 hover:text-white">Главная</a>
            <a href="#ai-stories" className="text-gray-400 hover:text-white">ИИ-Истории</a>
            <a href="#contact" className="text-gray-400 hover:text-white">Контакты</a>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}><Menu size={24} /></button>
        </div>
      </nav>

      <main>
        <AnimatePresence>
          {aboutOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-indigo-950 p-16 border-b border-white/10">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between mb-8">
                  <h2 className="text-3xl font-bold">О себе</h2>
                  <button onClick={() => setAboutOpen(false)}><X size={28} /></button>
                </div>
                {isAdmin ? (
                  <div className="space-y-4">
                    <textarea id="about-txt" defaultValue={about} className="w-full h-48 bg-white/5 border border-white/10 p-4 rounded-xl text-white" />
                    <button onClick={() => { setAbout((document.getElementById('about-txt') as any).value); alert('Сохранено!'); }} className="px-6 py-3 bg-indigo-600 rounded-lg font-bold">Сохранить</button>
                  </div>
                ) : <div className="text-gray-300 text-lg leading-relaxed">{about || 'Информация скоро будет...'}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroUrl}')` }}><div className="absolute inset-0 bg-black/40" /></div>
          <h1 className="relative z-10 text-5xl md:text-6xl font-bold text-center">Литературное хранилище</h1>
          <motion.a href="#ai-stories" className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown size={32} /></motion.a>
        </section>

        <WorksSection id="ai-stories" title="ИИ-истории" icon={<Cpu size={28} />} works={aiWorks} isAdmin={isAdmin} onAddWork={(w: any) => setAiWorks([w, ...aiWorks])} onDeleteWork={(i: number) => setAiWorks(aiWorks.filter((_, x) => x !== i))} onReadWork={setReader} />
        <WorksSection id="my-stories" title="Рассказы" icon={<BookText size={28} />} works={stories} isAdmin={isAdmin} onAddWork={(w: any) => setStories([w, ...stories])} onDeleteWork={(i: number) => setStories(stories.filter((_, x) => x !== i))} onReadWork={setReader} />
        
        <section id="contact" className="py-24 bg-stone-50 text-stone-900 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-12">Связаться со мной</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl bg-white p-12 rounded-3xl shadow-xl">
              <div className="space-y-6">
                <p className="text-gray-600">Буду рад вашему сообщению!</p>
                <div><h4 className="font-bold text-indigo-600">Email</h4><p>kostya.kozlov280.dmit@gmail.com</p></div>
                <div><h4 className="font-bold text-indigo-600">Telegram</h4><p>@kkmrdr</p></div>
              </div>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); window.location.href="mailto:kostya.kozlov280.dmit@gmail.com"; }}>
                <input type="text" className="w-full border p-3 rounded-lg" placeholder="Имя" />
                <textarea className="w-full border p-3 rounded-lg" placeholder="Сообщение" rows={4} />
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Send size={18} /> Отправить</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white text-gray-500 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p>© {new Date().getFullYear()} Козлов Константин</p>
          {isAdmin ? <button onClick={() => setIsAdmin(false)} className="text-red-500 font-bold">Выход</button> : <button onClick={() => { if(prompt('Пароль:')===(localStorage.getItem('authorPassword')||'author2024')) setIsAdmin(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold">Вход для автора</button>}
          <p className="flex items-center gap-1">Сделано с <Heart size={14} className="text-red-400 fill-current" /></p>
        </div>
      </footer>

      <ReaderModal work={reader} onClose={() => setReader(null)} />
    </div>
  );
}