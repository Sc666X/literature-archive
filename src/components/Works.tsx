import { motion } from 'framer-motion';
import { ExternalLink, ShoppingCart } from 'lucide-react';

const books = [
  {
    title: "Whispers of the Old Oak",
    category: "Literary Fiction",
    year: "2023",
    image: "/book1.jpg",
    description: "A multigenerational saga set in the heart of a vanishing forest, where secrets are as deep as the roots of the trees.",
    link: "#"
  },
  {
    title: "The Silent Manuscript",
    category: "Mystery / Thriller",
    year: "2021",
    image: "/book2.jpg",
    description: "When an anonymous package arrives at a small-town bookstore, a forgotten history of betrayal begins to unfold.",
    link: "#"
  },
  {
    title: "Echoes of the Shore",
    category: "Contemporary Fiction",
    year: "2019",
    image: "/hero-bg.jpg", // Reusing for variety if needed or generate more
    description: "An exploration of grief and renewal through the eyes of a woman returning to her childhood seaside home.",
    link: "#"
  }
];

const Works = () => {
  return (
    <section id="works" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Published Works</h2>
          <div className="w-20 h-1 bg-indigo-600 mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Each story is a journey. From the depths of the forest to the whispers of the ocean, explore the worlds I've created.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {books.map((book, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="relative h-96 overflow-hidden">
                <img 
                  src={book.image} 
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                  <button className="p-3 bg-white rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <ShoppingCart size={20} />
                  </button>
                  <button className="p-3 bg-white rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase mb-1 block">
                      {book.category}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                      {book.title}
                    </h3>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{book.year}</span>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  {book.description}
                </p>
                <a 
                  href={book.link}
                  className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                >
                  Learn More 
                  <span className="ml-2">→</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Works;
