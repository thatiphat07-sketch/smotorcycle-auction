import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Upload, CreditCard, ArrowLeft } from 'lucide-react';

export default function Topup() {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // จัดการเมื่อเลือกรูปสลิป
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // ส่งข้อมูลแจ้งโอนเงิน
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !amount) return alert('กรุณากรอกยอดเงินและแนบสลิป');

    setLoading(true);
    try {
      // 1. ดึงข้อมูล User ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนทำรายการ');
        navigate('/auth');
        return;
      }

      // 2. ตั้งชื่อไฟล์และอัปโหลดรูปสลิปไปที่ Supabase Storage (bucket: slips)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. ดึง Public URL ของรูปภาพสลิป
      const { data: { publicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(fileName);

      // 4. บันทึกข้อมูลรายการแจ้งโอนลงตาราง topup_requests
      const { error: insertError } = await supabase
        .from('topup_requests')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(amount),
            slip_url: publicUrl,
            status: 'pending'
          }
        ]);

      if (insertError) throw insertError;

      alert('แจ้งโอนเงินสำเร็จ! รอแอดมินตรวจสอบสลิปและอนุมัติเครดิตครับ');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <button 
        onClick={() => navigate('/profile')} 
        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 mb-4 transition"
      >
        <ArrowLeft size={18} /> ย้อนกลับไปหน้าโปรไฟล์
      </button>

      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> แจ้งเติมเครดิตมัดจำ
        </h2>

        {/* บัญชีธนาคารสำหรับโอนเงิน */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-xs text-blue-600 font-semibold mb-1">โอนเงินเข้าบัญชีร้าน ส.มอเตอร์ไซค์</p>
          <p className="font-bold text-gray-800 text-lg">ธนาคารกสิกรไทย (K-Bank)</p>
          <p className="text-xl font-mono text-blue-700 font-bold tracking-wider">xxx-x-xxxxx-x</p>
          <p className="text-sm text-gray-600">ชื่อบัญชี: ร้าน ส.มอเตอร์ไซค์</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ยอดเงินที่โอน (บาท)
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="เช่น 500 หรือ 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              แนบรูปภาพสลิปโอนเงิน
            </label>
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="slip-upload"
                required
              />
              <label htmlFor="slip-upload" className="cursor-pointer flex flex-col items-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Slip preview" className="max-h-56 rounded-md shadow" />
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={36} />
                    <span className="text-sm text-blue-600 font-medium">กดที่นี่เพื่อเลือกรูปสลิป</span>
                    <span className="text-xs text-gray-400 mt-1">รองรับไฟล์รูปภาพ JPG, PNG</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการแจ้งโอนเงิน'}
          </button>
        </form>
      </div>
    </div>
  );
}