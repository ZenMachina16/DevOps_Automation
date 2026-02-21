import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const linkClass =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors";

  const activeClass =
    "bg-slate-800 text-white";

  const inactiveClass =
    "text-slate-400 hover:bg-slate-900 hover:text-white";

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-white">ShipIQ</h1>
        <p className="text-xs text-slate-500">DevOps Control Platform</p>
      </div>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <HomeIcon className="h-5 w-5" />
          Overview
        </NavLink>

        <NavLink
          to="/dashboard/repositories"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <FolderIcon className="h-5 w-5" />
          Repositories
        </NavLink>

        <NavLink
          to="/dashboard/insights"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <ChartBarIcon className="h-5 w-5" />
          Insights
        </NavLink>

        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Cog6ToothIcon className="h-5 w-5" />
          Settings
        </NavLink>
      </nav>

      <div className="mt-auto text-xs text-slate-600">
        v1.0.0
      </div>
    </aside>
  );
}
