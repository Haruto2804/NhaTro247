import React from 'react';
import { X, ZoomIn } from 'lucide-react';

export const ProofViewerModal = ({ isOpen, onClose, photoUrl, title = 'Ảnh đối chứng thực tế công tơ' }) => {
  if (!isOpen || !photoUrl) return null;

  const fullUrl = photoUrl.startsWith('http')
    ? photoUrl
    : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000'}${photoUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm sm:text-base">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-4 flex items-center justify-center overflow-auto flex-1 bg-black/40">
          <img
            src={fullUrl}
            alt={title}
            className="max-h-[75vh] w-auto object-contain rounded-lg border border-slate-800 shadow-lg"
          />
        </div>

        {/* Footer note */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-t border-slate-700 text-xs text-slate-300 text-center">
          Dùng hai ngón tay trên điện thoại hoặc cuộn chuột trên máy tính để kiểm tra chi tiết dãy số đo.
        </div>
      </div>
    </div>
  );
};
