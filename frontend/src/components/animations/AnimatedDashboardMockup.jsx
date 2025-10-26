import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { LayoutDashboard, CheckCircle, GitBranch, AlertTriangle, Settings } from 'lucide-react';

// Helper component
const MockListItem = ({ icon: Icon, text, time, statusColor }) => (
  <div className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded transition-colors duration-150">
    <div className="flex items-center space-x-2">
      {Icon && <Icon className={`w-4 h-4 ${statusColor || 'text-gray-500'}`} />}
      <span className="text-gray-300 text-xs truncate">{text}</span>
    </div>
    <span className="text-gray-500 text-xs flex-shrink-0">{time}</span>
  </div>
);

const AnimatedDashboardMockup = () => {
  const containerRef = useRef(null);

  const targetProgress = useMotionValue(0); // raw scroll progress
  const smoothProgress = useMotionValue(0); // smoothed

  // Shimmer transform
  const backgroundPosX = useTransform(smoothProgress, [0, 1], ['200%', '-200%']);
  const shimmerOpacity = useTransform(smoothProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  // Smooth the progress manually with lerp
  useEffect(() => {
    const lerp = (start, end, factor) => start + (end - start) * factor;
    let animationFrame;
    const update = () => {
      smoothProgress.set(lerp(smoothProgress.get(), targetProgress.get(), 0.08)); // smooth factor
      animationFrame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [smoothProgress, targetProgress]);

  // Update targetProgress on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = 1 - (rect.bottom / (windowHeight + rect.height));
      targetProgress.set(Math.min(Math.max(progress, 0), 1));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialize
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetProgress]);

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full p-1 lg:p-2 bg-gradient-to-br from-gray-800 via-black to-gray-900 rounded-lg shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full bg-gray-900/50 rounded-md border border-gray-700/50 flex overflow-hidden backdrop-blur-md"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Sidebar */}
        <div className="w-1/4 lg:w-1/5 bg-gray-800/50 border-r border-gray-700/50 p-3 space-y-3 flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-green-500"></div>
            <span className="text-gray-400 font-medium text-xs">DevOps AI</span>
          </div>
          <div className="flex items-center space-x-2 p-1.5 bg-gray-700 rounded text-white">
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs">Dashboard</span>
          </div>
          <div className="flex items-center space-x-2 p-1.5 text-gray-400 hover:text-white">
            <GitBranch className="w-4 h-4" />
            <span className="text-xs">Pipelines</span>
          </div>
          <div className="flex items-center space-x-2 p-1.5 text-gray-400 hover:text-white">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Issues</span>
          </div>
          <div className="flex items-center space-x-2 p-1.5 text-gray-400 hover:text-white mt-auto absolute bottom-3">
            <Settings className="w-4 h-4" />
            <span className="text-xs">Settings</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="h-10 border-b border-gray-700/50 flex items-center px-4 flex-shrink-0">
            <span className="text-gray-500 text-xs">Overview / Active Pipelines</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            <MockListItem icon={CheckCircle} text="Pipeline prod-deploy-web completed" time="2m ago" statusColor="text-green-500" />
            <MockListItem icon={AlertTriangle} text="Security scan detected vulnerability CVE-..." time="1h ago" statusColor="text-yellow-500" />
            <MockListItem icon={GitBranch} text="Pipeline staging-api-test running..." time="Ongoing" statusColor="text-blue-500"/>
            <MockListItem icon={CheckCircle} text="Pipeline ci-frontend-build succeeded" time="3h ago" statusColor="text-green-500"/>
            <MockListItem icon={null} text="Agent initiated code rollback on staging" time="4h ago" />
            <div className="h-8 bg-gray-800 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-800 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>

        {/* Smooth Scroll-Synced Shimmer with Top-Right Fade */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)`,
            backgroundSize: '200% 100%',
            backgroundPositionX: backgroundPosX,
            opacity: shimmerOpacity,
            maskImage: 'radial-gradient(circle at top right, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'radial-gradient(circle at top right, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedDashboardMockup;
