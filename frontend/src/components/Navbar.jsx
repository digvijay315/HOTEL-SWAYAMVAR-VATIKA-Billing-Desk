import React, { useState } from "react";
import { LogOut, User, Coffee, Sun, Moon, Menu, X, Utensils, BedDouble, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentUser, onLogout, theme, toggleTheme, toggleSidebar }) {
  const navigate = useNavigate();
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  return (
    <nav className="glass border-b border-gold-800/20 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40 no-print">
      <div className="flex items-center gap-3">
        {currentUser && currentUser.role === "admin" && (
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <h1 className="text-xl font-black font-serif tracking-tight text-white leading-none">
              ROYAL MAJESTIC
            </h1>
            <p className="text-[9px] sm:text-[10px] text-amber-500 font-medium tracking-widest uppercase hidden sm:block">
              Premium Hotel & Restaurant
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gold-700/20 border border-gold-500/30 flex items-center justify-center text-amber-500">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
                  {currentUser.role}
                </p>
              </div>
            </div>
          )}

          {currentUser && currentUser.role === "staff" && (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-xl mr-2">
              <button
                onClick={() => navigate("/staff")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  window.location.pathname === "/staff"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Restaurant
              </button>
              <button
                onClick={() => navigate("/staff/rooms")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  window.location.pathname === "/staff/rooms"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Room Booking
              </button>
              <button
                onClick={() => navigate("/staff/kot")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  window.location.pathname === "/staff/kot"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                KOT Billing
              </button>
              <button
                onClick={() => navigate("/staff/grc")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  window.location.pathname === "/staff/grc"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Print GRC
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-amber-500 hover:bg-slate-850/50 transition-all flex items-center justify-center active:scale-95 no-print"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 hover:from-red-900 hover:to-red-800 text-red-200 text-sm font-medium rounded-xl transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        {currentUser && (
          <button 
            onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isStaffMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isStaffMenuOpen && currentUser && (
        <div className="absolute top-[72px] left-0 right-0 bg-slate-950 border-b border-gold-800/20 p-4 flex flex-col gap-3 z-50 md:hidden shadow-2xl animate-fade-in">
          {/* User Info inside menu */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl mb-1">
            <div className="w-10 h-10 rounded-lg bg-gold-700/20 border border-gold-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-base font-semibold text-slate-200">{currentUser.name}</p>
              <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
                {currentUser.role}
              </p>
            </div>
          </div>

          {/* Staff Nav Links */}
          {currentUser.role === "staff" && (
            <div className="flex flex-col gap-2 mb-1 border-b border-slate-800/50 pb-4 mt-2">
              <button
                onClick={() => { navigate("/staff"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  window.location.pathname === "/staff"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Utensils className="w-5 h-5" />
                Restaurant Billing
              </button>
              <button
                onClick={() => { navigate("/staff/rooms"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  window.location.pathname === "/staff/rooms"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <BedDouble className="w-5 h-5" />
                Room Booking
              </button>
              <button
                onClick={() => { navigate("/staff/kot"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  window.location.pathname === "/staff/kot"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Utensils className="w-5 h-5" />
                KOT Billing
              </button>
              <button
                onClick={() => { navigate("/staff/grc"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  window.location.pathname === "/staff/grc"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <FileText className="w-5 h-5" />
                Print GRC
              </button>
            </div>
          )}

          {/* Theme & Logout */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-amber-500 transition-all"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="font-medium text-sm">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 hover:from-red-900 text-red-200 font-medium rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
