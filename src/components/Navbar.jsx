import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          🏍️ ร้าน ส.มอเตอร์ไซค์
        </Link>
        
        <div className="flex gap-4 md:gap-6">
          <Link to="/" className="hover:text-blue-200 transition">
            🏠 หน้าร้าน
          </Link>
          <Link to="/profile" className="hover:text-blue-200 transition">
            👤 เมนูของฉัน
          </Link>
          <Link to="/admin" className="text-red-300 hover:text-red-100 transition">
            ⚙️ หลังร้าน
          </Link>
        </div>
      </div>
    </nav>
  );
}