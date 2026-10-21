import { useState, useEffect } from 'react';
import { Cpu, BookText, LibraryBig } from 'lucide-react';
import { Work } from './types';
import { defaultAiWorks } from './data/works';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { WorksSection } from './components/WorksSection';
import { ContactSection } from './components/ContactSection';
import { FooterBar } from './components/FooterBar';
import { ReaderModal } from './components/ReaderModal';
export default function App() {
  const [aiWorks, setAiWorks] = useState<Work[]>(() => {
    const saved = localStorage.getItem('aiWorks');
    return saved ? JSON.parse(saved) : defaultAiWorks;
  });
  const [personalStories, setPersonalStories] = useState<Work[]>(() => {
    const saved = localStorage.getItem('personalStories');
    return saved ? JSON.parse(saved) : [];
  });
  const [personalBooks, setPersonalBooks] = useState<Work[]>(() => {
    const saved = localStorage.getItem('personalBooks');
    return saved ? JSON.parse(saved) : [];
  });
  const [aboutContent, setAboutContent] = useState<string>(() => {
    const saved = localStorage.getItem('aboutContent');
    return saved ? JSON.parse(saved) : '';
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [readerWork, setReaderWork] = useState<Work | null>(null);
  useEffect(() => { localStorage.setItem('aiWorks', JSON.stringify(aiWorks)); }, [aiWorks]);
  useEffect(() => { localStorage.setItem('personalStories', JSON.stringify(personalStories)); }, [personalStories]);
  useEffect(() => { localStorage.setItem('personalBooks', JSON.stringify(personalBooks)); }, [personalBooks]);
  useEffect(() => { localStorage.setItem('aboutContent', JSON.stringify(aboutContent)); }, [aboutContent]);
  const handleLogin = () => {
    const pw = prompt('Введите пароль автора:');
    if (pw === 'author2024') setIsAdmin(true); // Замените на ваш пароль
    else if (pw !== null) alert('Неверный пароль');
  };
  return (
    <div className="min-h-screen bg-stone-900 text-white selection:bg-indigo-500">
      <Navbar 
        isAdmin={isAdmin} 
        hasAi={aiWorks.length > 0} 
        hasStories={personalStories.length > 0} 
        hasBooks={personalBooks.length > 0} 
        onAboutClick={() => setAboutOpen(!aboutOpen)} 
      />
      
      <main>
        <AboutSection 
          isOpen={aboutOpen} 
          onClose={() => setAboutOpen(false)} 
          isAdmin={isAdmin} 
          content={aboutContent} 
          onSave={setAboutContent} 
        />
        
        <HeroSection 
          hasAi={aiWorks.length > 0} 
          hasStories={personalStories.length > 0} 
          hasBooks={personalBooks.length > 0} 
        />
        <WorksSection 
          id="ai-stories" 
          title="ИИ-истории" 
          icon={<Cpu size={28} />} 
          works={aiWorks} 
          isAdmin={isAdmin} 
          onAddWork={(w) => setAiWorks([w, ...aiWorks])}
          onDeleteWork={(i) => setAiWorks(aiWorks.filter((_, idx) => idx !== i))}
          onReadWork={setReaderWork}
        />
        <WorksSection 
          id="my-stories" 
          title="Мои собственные рассказы" 
          icon={<BookText size={28} />} 
          works={personalStories} 
          isAdmin={isAdmin} 
          onAddWork={(w) => setPersonalStories([w, ...personalStories])}
          onDeleteWork={(i) => setPersonalStories(personalStories.filter((_, idx) => idx !== i))}
          onReadWork={setReaderWork}
        />
        <WorksSection 
          id="my-books" 
          title="Мои собственные книги" 
          icon={<LibraryBig size={28} />} 
          works={personalBooks} 
          isAdmin={isAdmin} 
          onAddWork={(w) => setPersonalBooks([w, ...personalBooks])}
          onDeleteWork={(i) => setPersonalBooks(personalBooks.filter((_, idx) => idx !== i))}
          onReadWork={setReaderWork}
        />
        <ContactSection />
      </main>
      <FooterBar 
        isAdmin={isAdmin} 
        onLogin={handleLogin} 
        onLogout={() => setIsAdmin(false)} 
        onChangePassword={() => alert('Функция в разработке')} 
      />
      <ReaderModal work={readerWork} onClose={() => setReaderWork(null)} />
    </div>
  );
}