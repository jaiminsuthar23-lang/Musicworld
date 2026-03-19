"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Music4, Loader, Play, Trash2, Calendar } from "lucide-react";

export default function Library({ 
  session, 
  onSelect 
}: { 
  session: any, 
  onSelect: (data: ArrayBuffer, name: string) => void 
}) {
  const [tabs, setTabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTabs();
  }, [session]);

  const fetchTabs = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guitar_tabs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTabs(data || []);
    } catch (error: any) {
      console.error("Error fetching tabs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const [loadingTabId, setLoadingTabId] = useState<string | null>(null);

  const loadTab = async (tab: any) => {
    setLoadingTabId(tab.id);
    try {
      const { data, error } = await supabase.storage
        .from('guitar-pro-files')
        .download(tab.file_path);

      if (error) throw error;
      
      const buffer = await data.arrayBuffer();
      onSelect(buffer, tab.name);
    } catch (error: any) {
      alert(`Error loading tab: ${error.message}`);
    } finally {
      setLoadingTabId(null);
    }
  };

  const deleteTab = async (e: React.MouseEvent, tab: any) => {
    e.stopPropagation(); // Don't trigger the click-to-play
    if (!confirm(`Are you sure you want to delete "${tab.name}"?`)) return;

    try {
      await supabase.storage.from('guitar-pro-files').remove([tab.file_path]);
      await supabase.from('guitar_tabs').delete().eq('id', tab.id);
      setTabs(tabs.filter(t => t.id !== tab.id));
    } catch (error: any) {
      alert(`Error deleting tab: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <Loader className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="w-full p-12 text-center text-white/40 border-t border-white/5 mt-8">
        <p>Your cloud library is empty. Upload your first file above!</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-12 border-t border-white/10 pt-12">
      <div className="flex items-center gap-3 mb-8 px-4">
        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
          <Music4 className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Music Vault</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {tabs.map((tab) => (
          <div 
            key={tab.id}
            onClick={() => loadTab(tab)}
            className="group glass-panel p-5 rounded-2xl border border-white/5 hover:border-violet-500/50 hover:bg-white/10 transition-all flex items-center justify-between cursor-pointer relative overflow-hidden active:scale-[0.98]"
          >
            {/* Hover Background Hint */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-lg group-hover:shadow-violet-600/20">
                {loadingTabId === tab.id ? (
                    <Loader className="w-6 h-6 animate-spin" />
                ) : (
                    <Music4 className="w-7 h-7" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">Click to Play</span>
                <h3 className="text-white font-semibold truncate text-lg group-hover:text-white transition-colors">{tab.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                  <Calendar className="w-3 h-3" />
                  Saved on {new Date(tab.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100 shadow-xl shadow-violet-600/40">
                   <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <button 
                    onClick={(e) => deleteTab(e, tab)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
                    title="Delete"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
