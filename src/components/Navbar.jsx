import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, ShieldAlert, Flame, Menu, X, Gavel, Wallet, Settings, Trophy } from 'lucide-react';
  const navLinks = [
    { name: 'หน้าร้าน', path: '/', icon: <Home size={18} /> },
    { name: 'ห้องประมูล', path: '/auction', icon: <Gavel size={18} /> },
    { name: 'แจ้งโอนเงินมัดจำ', path: '/topup', icon: <Wallet size={18} /> },
    { name: 'รถที่ชนะประมูล', path: '/my-wins', icon: <Trophy size={18} /> }, // เพิ่มบรรทัดนี้
  ];
export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // ฟังก์ชันเช็คหน้าปัจจุบันเพื่อไฮไลต์ปุ่ม
  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50 shadow-2xl backdrop-blur-md bg-opacity-90">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* 1. โลโก้ร้าน ส.มอเตอร์ไซค์ */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
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
        
        {/* 2. เมนูสำหรับหน้าจอคอมพิวเตอร์ (Desktop Menu) */}
        <div className="hidden md:flex gap-4 items-center">
          <Link 
            to="/" 
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/') 
                ? 'bg-red-600/20 text-red-400 border border-red-500/30 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home size={16} /> หน้าร้าน
          </Link>

          <Link 
            to="/profile" 
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
              isActive('/profile') 
                ? 'bg-red-600/20 text-red-400 border border-red-500/30 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User size={16} /> เมนูของฉัน
          </Link>

          {/* ปุ่มเข้าสู่ระบบหลังร้าน (Admin) */}
          <Link 
            to="/admin" 
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
              location.pathname.startsWith('/admin')
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-red-950 hover:text-red-400 hover:border-red-800'
            }`}
          >
            <ShieldAlert size={14} /> หลังร้าน
          </Link>
        </div>

        {/* 3. ปุ่ม Hamburger สำหรับหน้าจอมือถือ (Mobile Hamburger Button) */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 4. เมนูพับลงมาสำหรับหน้าจอมือถือ (Mobile Dropdown Menu) */}
      {isOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition ${
              isActive('/')
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Home size={18} /> หน้าร้านประมูล
          </Link>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition ${
              isActive('/profile')
                ? 'bg-red-600 text-white'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <User size={18} /> เมนูของฉัน (ดูเครดิตมัดจำ)
          </Link>

          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition border ${
              location.pathname.startsWith('/admin')
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-red-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert size={18} /> ระบบหลังร้าน (Admin)
          </Link>
        </div>
      )}
    </nav>
  );
}