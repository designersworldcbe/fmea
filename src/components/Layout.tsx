import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, ClipboardList, Database, Settings, LogOut, Search, Bell, Menu, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileSpreadsheet, label: 'PFMEA Documents', path: '/fmeas' },
    { icon: ClipboardList, label: 'Control Plans', path: '/control-plans' },
    { icon: Database, label: 'Knowledge Base', path: '/library' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F5F6] font-sans">
      {/* Shell Bar */}
      <header className="h-12 bg-[#354A5F] text-white flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wide">Quality Pro</h1>
            <div className="h-4 w-px bg-white/30 mx-2"></div>
            <span className="text-sm font-medium text-white/80">Risk Management</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block mr-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/70" size={16} />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-[#2A3B4C] border border-[#4A627A] text-white text-sm rounded-full pl-9 pr-4 py-1 w-64 focus:outline-none focus:bg-white focus:text-gray-900 transition-colors placeholder:text-white/70 focus:placeholder:text-gray-400"
            />
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bell size={18} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Settings size={18} />
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1D2D3E] hover:bg-[#2A3B4C] border border-[#4A627A] transition-colors ml-2">
            <User size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <nav className="flex-1 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 transition-colors group relative",
                    isActive 
                      ? "bg-[#EBF8FE] border-l-4 border-[#0A6ED1] text-[#0A6ED1]" 
                      : "border-l-4 border-transparent text-gray-700 hover:bg-gray-100"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon size={20} className={cn("min-w-[20px]", isActive ? "text-[#0A6ED1]" : "text-gray-500 group-hover:text-gray-700")} />
                  {sidebarOpen && <span className="ml-3 text-sm font-medium whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button className="flex items-center px-2 py-2 w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title={!sidebarOpen ? "Sign Out" : undefined}>
              <LogOut size={20} className="min-w-[20px]" />
              {sidebarOpen && <span className="ml-3 text-sm font-medium whitespace-nowrap">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
