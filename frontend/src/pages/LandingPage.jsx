import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  CogIcon, 
  DocumentTextIcon, 
  BeakerIcon,
  ChevronDownIcon,
  PlayIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('auth') === 'required') {
      setAuthMessage('Please connect your GitHub account to access the scan feature.');
    }
  }, [searchParams]);

  const features = [
    {
      icon: <CogIcon className="h-8 w-8" />,
      title: "Dockerfile Detection",
      description: "Instantly see if you have production-ready builds"
    },
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "CI/CD Check", 
      description: "Verify automated deployment pipelines"
    },
    {
      icon: <BeakerIcon className="h-8 w-8" />,
      title: "Test Coverage",
      description: "Identify missing or incomplete test suites"
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: "README Review",
      description: "Ensure your docs meet best practices"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Login & Connect GitHub",
      description: "Securely connect your GitHub account in seconds"
    },
    {
      number: "02", 
      title: "Select a Repository",
      description: "Choose any repo from your GitHub account"
    },
    {
      number: "03",
      title: "Get Gap Reports",
      description: "Fix your CI/CD pipelines, connect to cloud, build unit tests, maintain documentation"
    }
  ];

  const faqs = [
    {
      question: "How does ShipIQ work?",
      answer: "ShipIQ is your AI-powered junior DevOps engineer. It scans your GitHub repo, finds what's missing, and instantly sets up Dockerfiles, CI/CD pipelines, tests, and documentation — all validated and ready to deploy."
    },
    {
      question: "🛠 Will you change my code?",
      answer: "Yes — but only for the better. ShipIQ makes improvements in a separate branch and opens a pull request so you can review everything before merging."
    },
    {
      question: "🔒 Is my code safe?",
      answer: "Absolutely. Your code never leaves secure, encrypted workflows. No storage on third-party servers, no exposure — just safe, private automation inside your repo."
    },
    {
      question: "⚡ Can you connect to my CI/CD and cloud tools?",
      answer: "Yes. ShipIQ integrates with GitHub Actions, GitLab CI, CircleCI, and can connect to AWS, Azure, or GCP for deployments — all configured automatically."
    },
    {
      question: "🚀 What makes ShipIQ different?",
      answer: "Unlike simple analyzers, ShipIQ doesn't just tell you what's wrong — it fixes it. From gap detection to fully functional pipelines, it does what a junior DevOps engineer would, only faster and on-demand."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                ShipIQ
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                Features
              </a>
              <a href="#faq" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                FAQ
              </a>
            <button
  onClick={() => {
    console.log("🔗 Redirecting to GitHub App install...");
    window.location.href = "http://localhost:7000/auth/github-app/install";
  }}
  className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 hover:scale-105 transition-all duration-200 shadow-lg"
>
  Install GitHub App
</button>


            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400">
        {authMessage && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="font-medium">{authMessage}</p>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Find & Fix Missing{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200">
                  DevOps Essentials
                </span>{' '}
                in Your Codebase — Instantly.
              </h1>
              <p className="mt-6 text-xl text-white/90 leading-relaxed">
                ShipIQ scans your GitHub repos and detects missing Dockerfiles, CI/CD pipelines, tests, and more — so you can ship with confidence.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
  href="http://localhost:7000/auth/github-app/install"
  className="inline-flex items-center px-8 py-4 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
>
  Install GitHub App
  <ArrowRightIcon className="ml-2 h-5 w-5" />
</a>

                <button 
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <PlayIcon className="mr-2 h-5 w-5" />
                  Learn More
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-slate-500">Repository Analysis</div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Dockerfile", status: "✅", color: "text-emerald-600" },
                    { name: "CI/CD Pipeline", status: "❌", color: "text-red-600" },
                    { name: "README.md", status: "✅", color: "text-emerald-600" },
                    { name: "Tests", status: "⚠️", color: "text-yellow-600" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className={`font-semibold ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Ship Confidently
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Comprehensive DevOps analysis in seconds
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-900 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Get started in minutes, not hours
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-indigo-600 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Everything you need to know about ShipIQ
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl"
                >
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDownIcon 
                    className={`h-5 w-5 text-slate-500 transition-transform ${
                      activeAccordion === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeAccordion === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-600 dark:text-slate-300">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold text-indigo-400 mb-4">ShipIQ</div>
              <p className="text-slate-400 mb-6">
                AI-powered repository analysis for confident shipping.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ShipIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
