import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MyWins from './pages/MyWins'; 
import Home from './pages/Home';
import ProfileMenu from './pages/ProfileMenu';
import Auth from './pages/Auth';
import Topup from './pages/Topup';
import AuctionRoom from './pages/AuctionRoom';
import AdminDashboard from './pages/admin/AdminDashboard';
// เพิ่ม Import นี้ด้านบน


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auction/:id" element={<AuctionRoom />} />
            <Route path="/profile" element={<ProfileMenu />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/topup" element={<Topup />} />
            <Route path="/my-wins" element={<MyWins />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}