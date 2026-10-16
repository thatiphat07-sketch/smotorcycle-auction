import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ProfileMenu() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 border-l-4 border-blue-600 pl-3">
        เมนูของฉัน
      </h2>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
            {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{profile?.full_name || 'ผู้ใช้งาน'}</h3>
            <p className="text-gray-500 text-sm">โทร: {profile?.phone || '-'}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg border mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-gray-500 text-sm">เครดิตมัดจำคงเหลือ</p>
            <p className="text-3xl font-bold text-green-600">
              ฿ {profile?.credit_balance ? profile.credit_balance.toLocaleString() : '0'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/topup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            แจ้งเติมเครดิต
          </button>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full text-left p-4 border border-red-100 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}