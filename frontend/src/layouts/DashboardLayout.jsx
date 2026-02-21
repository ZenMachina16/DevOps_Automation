import { Outlet } from "react-router-dom";
import Sidebar from "../Components/dashboard/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
