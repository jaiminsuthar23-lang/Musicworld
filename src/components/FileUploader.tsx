"use client";

import { UploadCloud, Loader } from "lucide-react";
import { useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function FileUploader({ 
  onFileLoaded, 
  session 
}: { 
  onFileLoaded: (data: ArrayBuffer, name: string) => void,
  session: any
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!session?.user) return;
    
    setUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('guitar-pro-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Save metadata to Database
      const { error: dbError } = await supabase
        .from('guitar_tabs')
        .insert({
          user_id: session.user.id,
          name: file.name,
          file_path: filePath
        });

      if (dbError) throw dbError;

      // 3. Load locally for immediate view
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileLoaded(e.target.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
      
    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`w-full max-w-xl p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer group relative
        ${isDragging 
          ? 'border-violet-400 bg-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]' 
          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-violet-500/50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleChange}
        accept=".gp,.gp3,.gp4,.gp5,.gpx"
        title=""
        value=""
      />
      <div className="flex flex-col items-center justify-center text-center pointer-events-none">
        {uploading ? (
          <Loader className="w-12 h-12 mb-4 text-violet-400 animate-spin" />
        ) : (
          <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-violet-400' : 'text-white/60 group-hover:text-white/80'}`} />
        )}
        <p className={`text-lg font-medium transition-colors ${isDragging ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
          {uploading ? 'Uploading to Cloud...' : isDragging ? 'Drop your Guitar Pro file here!' : 'Drag & drop your Guitar Pro file here'}
        </p>
        <p className="text-sm text-white/50 mt-2">
          {uploading ? 'Protecting your music vault...' : 'Supports .gp, .gp5, .gpx, etc. Or click to browse.'}
        </p>
      </div>
    </div>
  );
}
