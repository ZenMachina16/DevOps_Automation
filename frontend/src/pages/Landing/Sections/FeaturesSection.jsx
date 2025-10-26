import React from "react";
import { motion } from "framer-motion";

const features = [
  { title: "Scan Code", description: "Detect missing tests or outdated docs" },
  { title: "Auto Deploy", description: "Deploy fixes automatically" },
  { title: "Reports", description: "Generate actionable reports" },
  { title: "Notifications", description: "Get alerts on key actions" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="features-section py-32 px-6 bg-gray-800">
      <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            className="bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
