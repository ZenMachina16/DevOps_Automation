import { motion } from 'framer-motion';
import { Rocket, Github, ShieldCheck, TerminalSquare } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="space-y-10 animate-fadeIn">
      <section className="text-center py-10">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-extrabold bg-gradient-to-b from-brand-400 to-brand-700 bg-clip-text text-transparent"
        >
          Ship Confidently
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-gray-600 text-lg"
        >
          Automated repository gap detection for Docker, CI/CD, README, and Tests.
        </motion.p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/signup"><Button size="lg">Get Started</Button></Link>
          <Link to="/scan"><Button size="lg" variant="outline">Scan a repo</Button></Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {[{
          icon: <Rocket className="text-brand" />, title: 'Quick setup', text: 'Connect and scan in seconds with GitHub.'
        },{
          icon: <Github className="text-brand" />, title: 'GitHub native', text: 'Reads trees, workflows, and package scripts.'
        },{
          icon: <ShieldCheck className="text-brand" />, title: 'Secure', text: 'Token-based auth with role-based access.'
        }].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="h-10 w-10">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-lg">{f.title}</h3>
            <p className="text-gray-600 mt-2 text-sm">{f.text}</p>
          </motion.div>
        ))}
      </section>

      <section className="rounded-xl border bg-gradient-to-br from-brand-50 to-white p-6 md:p-10 relative overflow-hidden">
        <TerminalSquare className="absolute -right-6 -top-6 h-32 w-32 text-brand/10 animate-float" />
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <li className="rounded-lg border bg-white p-4">1. Authenticate and paste a GitHub repo URL</li>
          <li className="rounded-lg border bg-white p-4">2. We fetch the repository tree and package.json</li>
          <li className="rounded-lg border bg-white p-4">3. We return a gap report with clear actions</li>
        </ol>
      </section>
    </div>
  );
}


