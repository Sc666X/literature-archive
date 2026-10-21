import { Mail, Send } from 'lucide-react';



const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Contact Info */}
            <div className="p-12 lg:p-16 bg-indigo-900 text-white">
              <h2 className="text-4xl font-serif font-bold mb-6">Связаться со мной</h2>
              <p className="text-indigo-200 mb-12 text-lg">
                Будь вы читателем, коллегой-писателем или заинтересованы в сотрудничестве, я буду рад вашему сообщению.
              </p>

              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300">
                    <Mail size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Email</h4>
                    <p className="text-xl">kostya.kozlov280.dmit@gmail.com</p>
                  </div>
                </div>

                <a 
                  href="https://t.me/kkmrdr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-6 group hover:bg-indigo-800/50 p-2 -m-2 rounded-xl transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-800 rounded-full flex items-center justify-center text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <svg 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="translate-x-[-1px] translate-y-[1px]"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Telegram</h4>
                    <p className="text-xl">@kkmrdr</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Form */}
            <div className="p-12 lg:p-16">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="ivan@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тема</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Общий запрос"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сообщение</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Ваше сообщение здесь..."
                  ></textarea>
                </div>
                <button 
                  type="button"
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                >
                  <span>Отправить сообщение</span>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
