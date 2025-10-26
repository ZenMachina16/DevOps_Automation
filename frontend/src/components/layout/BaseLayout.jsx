import ThemeToggle from "../ui/ThemeToggle";

export default function BaseLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="flex justify-between items-center p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">DevOps Automation</h1>
        <ThemeToggle />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
