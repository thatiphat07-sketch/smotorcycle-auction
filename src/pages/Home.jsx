import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  // สร้าง State ไว้เก็บข้อมูลที่ดึงมาจาก Supabase
  const [auctionItems, setAuctionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ใช้ useEffect เพื่อดึงข้อมูลทันทีที่เปิดหน้าเว็บ
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      // ดึงข้อมูลจากตาราง auction_items เฉพาะคันที่ status เป็น active
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      setAuctionItems(data);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xl text-gray-600">กำลังโหลดข้อมูลรายการรถ...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 border-l-4 border-blue-600 pl-3">
        รายการรถและอะไหล่ประมูล
      </h2>
      
      {auctionItems.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีรายการเปิดประมูลในขณะนี้</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctionItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
              <img 
                src={item.image_url} 
                alt={item.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                <p className="text-gray-600 mt-1 h-12 overflow-hidden text-sm">{item.description}</p>
                
                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500">มัดจำป้าย: ฿{item.deposit_required.toLocaleString()}</p>
                    <p className="text-xl font-bold text-red-600">
                      เริ่ม ฿ {item.base_price.toLocaleString()}
                    </p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm">
                    เข้าห้องประมูล
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
