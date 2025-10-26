import React, { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  { q: "What is Agentic AI?", a: "Agentic AI automates DevOps tasks intelligently using smart agents." },
  { q: "Do I need DevOps knowledge?", a: "No, it’s designed for both technical and non-technical users." },
  { q: "Which pipelines are supported?", a: "Supports full CI/CD pipelines including code scan, test, and deployment." },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="faq-section py-32 px-6 bg-gray-900">
      <h2 className="text-4xl font-bold text-center mb-12">FAQs</h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <motion.div
            key={idx}
            className="bg-gray-700 p-6 rounded-xl cursor-pointer"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-semibold">{faq.q}</h3>
            {openIndex === idx && <p className="mt-2">{faq.a}</p>}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
