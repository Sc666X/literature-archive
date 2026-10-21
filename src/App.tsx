import { useState, useEffect } from 'react';
import { Cpu, FileText, Book } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import LiteratureSection, { Work } from './components/LiteratureSection';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const [aiWorks, setAiWorks] = useState<Work[]>([]);
  const [personalStories, setPersonalStories] = useState<Work[]>([]);
  const [personalBooks, setPersonalBooks] = useState<Work[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorPassword, setAuthorPassword] = useState('автор');
  const [aboutContent, setAboutContent] = useState('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleLogin = () => {
    const pass = prompt('Введите пароль автора:');
    if (pass === authorPassword) {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
    } else {
      if (pass !== null) alert('Неверный пароль');
    }
  };

  const handleChangePassword = () => {
    const newPass = prompt('Введите новый пароль:');
    if (newPass && newPass.trim().length > 0) {
      setAuthorPassword(newPass);
      localStorage.setItem('authorPassword', newPass);
      alert('Пароль успешно изменен!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
  };

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('isAdmin');
    if (adminStatus === 'true') setIsAdmin(true);

    const savedPass = localStorage.getItem('authorPassword');
    if (savedPass) setAuthorPassword(savedPass);
    
    const savedAi = localStorage.getItem('aiWorks');
    const savedStories = localStorage.getItem('personalStories');
    const savedBooks = localStorage.getItem('personalBooks');
    const savedAbout = localStorage.getItem('aboutContent');

    if (savedAi) setAiWorks(JSON.parse(savedAi));
    if (savedStories) setPersonalStories(JSON.parse(savedStories));
    if (savedBooks) setPersonalBooks(JSON.parse(savedBooks));
    if (savedAbout) setAboutContent(savedAbout);
  }, []);

  useEffect(() => {
    localStorage.setItem('aiWorks', JSON.stringify(aiWorks));
  }, [aiWorks]);

  useEffect(() => {
    localStorage.setItem('personalStories', JSON.stringify(personalStories));
  }, [personalStories]);

  useEffect(() => {
    localStorage.setItem('personalBooks', JSON.stringify(personalBooks));
  }, [personalBooks]);

  useEffect(() => {
    localStorage.setItem('aboutContent', aboutContent);
  }, [aboutContent]);

  const toggleAbout = () => {
    if (isAdmin || aboutContent.trim().length > 0) {
      // Если закрыто - открываем, если открыто - просто перемещаемся к началу
      setIsAboutOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 selection:bg-indigo-500 selection:text-white">
      <Navbar 
        isAdmin={isAdmin} 
        hasAi={aiWorks.length > 0} 
        hasStories={personalStories.length > 0} 
        hasBooks={personalBooks.length > 0} 
        onAboutClick={toggleAbout}
      />
      <main>
        <About 
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          isAdmin={isAdmin}
          content={aboutContent}
          onSave={(newContent) => {
            setAboutContent(newContent);
            alert('Данные сохранены!');
          }}
        />
        <Hero 
          isAdmin={isAdmin} 
          hasAi={aiWorks.length > 0} 
          hasStories={personalStories.length > 0} 
          hasBooks={personalBooks.length > 0} 
        />
        
        <LiteratureSection 
          id="ai-stories" 
          title="ИИ-истории" 
          icon={<Cpu size={24} />} 
          works={aiWorks}
          isAdmin={isAdmin}
          onAddWork={(work) => setAiWorks([work, ...aiWorks])}
          onDeleteWork={(index) => setAiWorks(aiWorks.filter((_, i) => i !== index))}
        />

        <LiteratureSection 
          id="my-stories" 
          title="Мои собственные рассказы" 
          icon={<FileText size={24} />} 
          works={personalStories}
          isAdmin={isAdmin}
          onAddWork={(work) => setPersonalStories([work, ...personalStories])}
          onDeleteWork={(index) => setPersonalStories(personalStories.filter((_, i) => i !== index))}
        />

        <LiteratureSection 
          id="my-books" 
          title="Мои собственные книги" 
          icon={<Book size={24} />} 
          works={personalBooks}
          isAdmin={isAdmin}
          onAddWork={(work) => setPersonalBooks([work, ...personalBooks])}
          onDeleteWork={(index) => setPersonalBooks(personalBooks.filter((_, i) => i !== index))}
        />

        <Contact />
      </main>
      <Footer 
        isAdmin={isAdmin} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
        hasAnyContent={aiWorks.length > 0 || personalStories.length > 0 || personalBooks.length > 0}
      />
    </div>
  );
}

export default App;
