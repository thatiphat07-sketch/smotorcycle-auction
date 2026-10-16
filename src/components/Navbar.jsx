import { Link, useLocation } from 'react-router-dom';
import { Home, User, ShieldAlert, Flame } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50 shadow-2xl backdrop-blur-md bg-opacity-90">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* โลโก้ร้าน ส.มอเตอร์ไซค์ */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-red-600 p-2 rounded-lg transform -skew-x-12 group-hover:bg-red-500 transition shadow-lg shadow-red-600/30">
            <span className="font-black text-xl italic tracking-tighter text-white transform skew-x-12 inline-block">
              S.MOTOR
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-slate-100 group-hover:text-red-400 transition">
              ส.มอเตอร์ไซค์
            </span>
            <span className="text-[10px] text-slate-400 tracking-widest uppercase flex items-center gap-1">
              <Flame size={10} className="text-red-500 animate-pulse" /> Live Auction Platform
            </span>
          </div>
        </Link>
        
        {/* เมนูการใช้งาน */}
        <div className="flex gap-2 md:gap-4 items-center">
          <Link 
            to="/" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              isActive('/') 
                ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home size={16} /> <span className="hidden sm:inline">หน้าร้าน</span>
          </Link>

          <Link 
            to="/profile" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              isActive('/profile') 
                ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User size={16} /> <span className="hidden sm:inline">เมนูของฉัน</span>
          </Link>

          {/* ปุ่มไปหลังร้านแอดมิน */}
          <Link 
            to="/admin" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-red-950 hover:text-red-400 hover:border-red-800 transition"
          >
            <ShieldAlert size={14} /> <span className="hidden sm:inline">หลังร้าน</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}