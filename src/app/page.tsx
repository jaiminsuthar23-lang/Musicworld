"use client";

import { Music4, LogOut, Library as LibraryIcon } from "lucide-react";
import { useEffect, useState } from "react";
import FileUploader from "@/components/FileUploader";
import GuitarProViewer from "@/components/GuitarProViewer";
import Auth from "@/components/Auth";
import { supabase } from "@/utils/supabase";

import Library from "@/components/Library";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileLoaded = (data: ArrayBuffer, name: string) => {
    setFileData(data);
    setFileName(name);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setFileData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center p-8 min-h-screen">
         <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Music4 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">MUSICWORLD by J</h1>
          </div>
        <Auth />
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 items-center justify-start p-8 sm:p-16 min-h-screen">
      {!fileData ? (
        <div className="glass-panel w-full max-w-4xl p-12 mt-12 mb-12 rounded-3xl flex flex-col items-center text-center animate-fade-in-up">
          <div className="w-full flex justify-end absolute top-6 right-6">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
            <Music4 className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            MUSICWORLD by J
          </h1>
          <p className="text-lg text-white/60 max-w-lg mb-10">
            Welcome back! Upload a new Guitar Pro lesson or choose from your cloud library below.
          </p>
          
          <FileUploader onFileLoaded={handleFileLoaded} session={session} />
          
          <Library session={session} onSelect={handleFileLoaded} />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center animate-fade-in-up w-full">
           <div className="w-full flex justify-between items-center max-w-5xl mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Music4 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">MUSICWORLD by J</h1>
             </div>
             <div className="flex items-center gap-2">
                <button 
                    onClick={() => setFileData(null)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Back to Library
                </button>
                <button 
                  onClick={handleSignOut}
                  className="p-2 aspect-square rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
             </div>
           </div>
           
           <GuitarProViewer fileData={fileData} fileName={fileName} />
        </div>
      )}
    </main>
  );
}
