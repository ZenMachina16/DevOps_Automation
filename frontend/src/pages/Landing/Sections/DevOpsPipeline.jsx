import React from "react";
import { motion } from "framer-motion";

const steps = [
  { name: "Code", description: "Write and commit code to the repository" },
  { name: "Build", description: "Compile and build artifacts" },
  { name: "Test", description: "Run automated tests" },
  { name: "Deploy", description: "Deploy to production or staging" },
];

const DevOpsPipeline = () => {
  return (
    <section id="pipeline" className="pipeline-section py-32 px-6 bg-gray-800">
      <h2 className="text-4xl font-bold text-center mb-12">CI/CD Pipeline</h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-12">
        {steps.map((step, idx) => (
          <motion.div
            key={step.name}
            className="flex flex-col items-center bg-gray-700 rounded-xl p-6 shadow-lg w-60"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">{step.name[0]}</span>
            </div>
            <h3 className="text-2xl font-semibold mb-2">{step.name}</h3>
            <p className="text-center">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Gemini / Lottie pipeline animation */}
      <div className="mt-16">
        {/* Example: <GeminiAnimation src="pipeline_animation.json" /> */}
      </div>
    </section>
  );
};

export default DevOpsPipeline;
