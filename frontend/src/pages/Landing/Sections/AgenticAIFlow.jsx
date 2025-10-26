import React from "react";
import { motion } from "framer-motion";

const tasks = [
  "Scan Repos",
  "Identify Issues",
  "Auto-Fix Code",
  "Deploy Changes",
  "Generate Reports",
];

const AgenticAIFlow = () => {
  return (
    <section id="workflow" className="agent-section py-32 px-6 bg-gray-900">
      <h2 className="text-4xl font-bold text-center mb-12">Agentic AI Workflow</h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-12">
        {tasks.map((task, idx) => (
          <motion.div
            key={task}
            className="flex flex-col items-center bg-gray-700 rounded-xl p-6 shadow-lg w-52"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: idx * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              {idx + 1}
            </div>
            <h3 className="text-xl font-semibold">{task}</h3>
          </motion.div>
        ))}
      </div>

      {/* Gemini / Lottie AI workflow animation */}
      <div className="mt-16">
        {/* Example: <GeminiAnimation src="agent_flow.json" /> */}
      </div>
    </section>
  );
};

export default AgenticAIFlow;
