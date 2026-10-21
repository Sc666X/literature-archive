import { motion } from 'framer-motion';
import { BookText, ArrowRight } from 'lucide-react';

const stories = [
  {
    title: "The Clockmaker's Daughter",
    excerpt: "Time in the village of Aethelgard didn't flow like it did elsewhere. Here, minutes were measured in heartbeats and hours in the turning of golden gears.",
    date: "May 2024",
    readTime: "12 min read"
  },
  {
    title: "Midnight in the Attic",
    excerpt: "Every old house has a memory. Ours just happened to have a voice, one that only spoke when the moon was at its highest point.",
    date: "March 2024",
    readTime: "8 min read"
  },
  {
    title: "The Last Letter from Sora",
    excerpt: "The ink was faded, stained by salt spray and years of longing. But the message remained clear: 'Wait for me where the sky meets the sea.'",
    date: "January 2024",
    readTime: "15 min read"
  }
];

const ShortStories = () => {
  return (
    <section id="short-stories" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Short Stories & Essays</h2>
            <div className="w-20 h-1 bg-indigo-600 mb-6"></div>
            <p className="text-gray-600">
              Occasional pieces exploring the small moments of life, reflections on the writing process, and experimental prose.
            </p>
          </div>
          <a href="#" className="inline-flex items-center text-indigo-600 font-medium hover:underline">
            View all stories <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>

        <div className="space-y-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 border border-gray-100 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <BookText className="text-indigo-400 h-5 w-5" />
                    <span className="text-sm font-medium text-gray-400">{story.date} • {story.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-3xl italic">
                    "{story.excerpt}"
                  </p>
                </div>
                <button className="self-start md:self-center px-6 py-2 border border-indigo-200 text-indigo-600 rounded-full font-medium hover:bg-indigo-600 hover:text-white transition-all">
                  Read Story
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShortStories;
