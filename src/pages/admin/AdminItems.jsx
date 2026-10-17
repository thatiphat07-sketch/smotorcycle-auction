import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Edit3, Upload, X, Image as ImageIcon, Check, RefreshCw, Clock } from 'lucide-react';

export default function AdminItems() {
  // 1. ประกาศ Hooks ทั้งหมดไว้บนสุด
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับฟอร์มเพิ่มสินค้าใหม่
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [depositRequired, setDepositRequired] = useState('500');
  const [liveUrl, setLiveUrl] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // State สำหรับ Modal แก้ไขสินค้า
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editDepositRequired, setEditDepositRequired] = useState('500');
  const [editLiveUrl, setEditLiveUrl] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadFilesToStorage = async (files) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('auction-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  // -------------------------------------------------------------
  // ฟังก์ชันเพิ่มเวลาประมูลสด +5 นาที
  // -------------------------------------------------------------
  const handleAddExtraMinutes = async (itemId, currentEndTime) => {
    const baseTime = currentEndTime ? new Date(currentEndTime) : new Date();
    const newEndTime = new Date(baseTime.getTime() + 5 * 60000).toISOString();

    try {
      const { error } = await supabase
        .from('auction_items')
        .update({ end_time: newEndTime })
        .eq('id', itemId);

      if (error) throw error;
      alert('ต่อเวลาประมูลเพิ่ม +5 นาที เรียบร้อยแล้ว!');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // -------------------------------------------------------------
  // 1. เพิ่มสินค้าใหม่
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title || !basePrice) return alert('กรุณากรอกยี่ห้อ/รุ่น และราคาเริ่มต้น');
    if (selectedFiles.length === 0) return alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');

    setSubmitting(true);
    try {
      const uploadedImageUrls = await uploadFilesToStorage(selectedFiles);

      const { error } = await supabase.from('auction_items').insert([
        {
          title,
          description,
          base_price: parseFloat(basePrice),
          deposit_required: parseFloat(depositRequired),
          live_url: liveUrl,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          image_url: uploadedImageUrls[0],
          images: uploadedImageUrls,
          status: 'active'
        }
      ]);

      if (error) throw error;

      alert('ลงประกาศประมูลและอัปโหลดรูปภาพสำเร็จ!');
      setTitle('');
      setDescription('');
      setBasePrice('');
      setLiveUrl('');
      setEndTime('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. แก้ไขสินค้า (Modal)
  // -------------------------------------------------------------
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditBasePrice(item.base_price || '');
    setEditDepositRequired(item.deposit_required || '500');
    setEditLiveUrl(item.live_url || '');
    
    // แปลงเวลาให้เข้ากับ input type="datetime-local"
    if (item.end_time) {
      const d = new Date(item.end_time);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditEndTime(d.toISOString().slice(0, 16));
    } else {
      setEditEndTime('');
    }
    
    const imgs = Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : (item.image_url ? [item.image_url] : []);
    setEditExistingImages(imgs);
    setEditNewFiles([]);
    setEditNewPreviews([]);
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setEditNewFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setEditNewPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveExistingImage = (index) => {
    setEditExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editTitle || !editBasePrice) return alert('กรุณากรอกยี่ห้อ/รุ่น และราคาเริ่มต้น');

    setSubmitting(true);
    try {
      let newlyUploadedUrls = [];
      if (editNewFiles.length > 0) {
        newlyUploadedUrls = await uploadFilesToStorage(editNewFiles);
      }

      const allFinalImages = [...editExistingImages, ...newlyUploadedUrls];

      if (allFinalImages.length === 0) {
        setSubmitting(false);
        return alert('ต้องมีรูปภาพสินค้าอย่างน้อย 1 รูป');
      }

      const { error } = await supabase
        .from('auction_items')
        .update({
          title: editTitle,
          description: editDescription,
          base_price: parseFloat(editBasePrice),
          deposit_required: parseFloat(editDepositRequired),
          live_url: editLiveUrl,
          end_time: editEndTime ? new Date(editEndTime).toISOString() : null,
          image_url: allFinalImages[0],
          images: allFinalImages,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      alert('อัปเดตข้อมูลรายการสินค้าเรียบร้อยแล้ว!');
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. ลบสินค้า
  // -------------------------------------------------------------
  const handleDeleteItem = async (id, itemTitle) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${itemTitle}" ออกจากระบบ?`)) return;

    try {
      const { error } = await supabase.from('auction_items').delete().eq('id', id);
      if (error) throw error;
      alert('ลบรายการสินค้าเรียบร้อยแล้ว');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. ฟอร์มลงประกาศรถคันใหม่ */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <PlusCircle className="text-red-500" /> ลงประกาศรถ / อะไหล่ประมูลคันใหม่
        </h2>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">ยี่ห้อ / รุ่นรถ</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">ราคาเริ่มต้น (บาท)</label>
            <input
              type="number"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">เครดิตมัดจำสู้ราคา (บาท)</label>
            <input
              type="number"
              required
              value={depositRequired}
              onChange={(e) => setDepositRequired(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">เวลาปิดประมูล</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">URL ไลฟ์สด (YouTube/Facebook)</label>
            <input
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="block font-semibold text-slate-300">อัปโหลดรูปภาพตัวรถ (เลือกได้หลายรูป)</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-xl p-6 text-center bg-slate-950 transition cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-new"
              />
              <label htmlFor="file-upload-new" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="text-red-500" size={32} />
                <span className="text-sm font-bold text-slate-200">กดที่นี่เพื่อเลือกรูปภาพจากเครื่อง</span>
              </label>
            </div>
          </div>

          {previewUrls.length > 0 && (
            <div className="sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-black uppercase shadow-lg shadow-red-600/30"
            >
              {submitting ? 'กำลังบันทึก...' : 'ลงประกาศประมูล'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. รายการรถทั้งหมด */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white">รายการรถประมูลทั้งหมด</h3>
          <button onClick={fetchItems} className="flex items-center gap-1 text-xs text-slate-400 p-2 rounded-lg bg-slate-950 border border-slate-800">
            <RefreshCw size={14} /> รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-red-500 font-extrabold">฿{item.base_price?.toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEditModal(item)} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteItem(item.id, item.title)} className="p-2 bg-red-600/10 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                  <button onClick={() => handleAddExtraMinutes(item.id, item.end_time)} className="flex items-center justify-center gap-1 text-[10px] bg-slate-800 text-slate-300 py-1 px-2 rounded border border-slate-700 hover:bg-slate-700">
                    <Clock size={12}/> +5 นาที
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal แก้ไข */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white border-b border-slate-800 pb-3 mb-4 flex justify-between">
              แก้ไขรายการประมูล <button onClick={() => setEditingItem(null)} className="text-slate-400"><X size={18}/></button>
            </h3>
            <form onSubmit={handleUpdateItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <label className="text-slate-300 mb-1 block">ยี่ห้อ / รุ่นรถ</label>
                <input required type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3" />
              </div>
              <div>
                <label className="text-slate-300 mb-1 block">ราคาเริ่มต้น (บาท)</label>
                <input required type="number" value={editBasePrice} onChange={(e) => setEditBasePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3" />
              </div>
              <div>
                <label className="text-slate-300 mb-1 block">เวลาปิดประมูล</label>
                <input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-300 mb-1 block">URL ไลฟ์สด</label>
                <input type="text" value={editLiveUrl} onChange={(e) => setEditLiveUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3" />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-slate-300">อัปโหลดรูปภาพตัวรถ (เลือกได้หลายรูป)</label>
                <div className="border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-xl p-6 text-center bg-slate-950 transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden"
                    id="file-upload-edit"
                  />
                  <label htmlFor="file-upload-edit" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="text-blue-500" size={24} />
                    <span className="text-sm font-bold text-slate-200">เลือกรูปภาพใหม่เพื่ออัปโหลดเพิ่ม</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-3 mt-4">
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}