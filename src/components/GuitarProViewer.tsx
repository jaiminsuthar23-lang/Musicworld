"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Loader, Gauge, Repeat, BellRing, Settings2 } from "lucide-react";

export default function GuitarProViewer({ fileData, fileName }: { fileData: ArrayBuffer | null, fileName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const addLog = (msg: string) => console.log(`[AlphaTab] ${msg}`);
  const addError = (msg: string, err?: any) => console.error(`[AlphaTab] ${msg}`, err);

  useEffect(() => {
    if (!containerRef.current || !fileData) return;

    let initApi: any;
    let isMounted = true;
    setIsReady(false);
    addLog("Initializing AlphaTab...");

    const startAlphaTab = () => {
      const alphaTab = (window as any).alphaTab;
      if (!alphaTab) {
        if (isMounted) {
          addLog("Waiting for AlphaTab script...");
          setTimeout(startAlphaTab, 100);
        }
        return;
      }

      try {
        const origin = window.location.origin;
        const sfUrl = origin + '/soundfont/sonivox.sf2';
        
        addLog(`AlphaTab Version: ${alphaTab.Settings?.version || '1.8.x'}`);
        
        // Proactive check
        fetch(sfUrl, { method: 'HEAD' })
          .then(r => addLog(r.ok ? "✅ SoundFont reachable" : "❌ SoundFont NOT reachable"))
          .catch(e => addError("SoundFont check failed", e));

        initApi = new alphaTab.AlphaTabApi(containerRef.current!, {
          core: {
            engine: 'svg',
            fontDirectory: origin + '/font/',
            useWorkers: false
          },
          display: {
            layoutMode: alphaTab.LayoutMode.Page,
          },
          player: {
            enablePlayer: true,
            soundFont: sfUrl,
            enableCursor: true,
            enableAnimatedBeatCursor: true,
            enableElementHighlighting: true
          }
        });
        
        if (!initApi.player) {
           addError("CRITICAL: Player object is STILL null!");
        } else {
           addLog("✅ Player object found!");
        }

        initApi.playerReady.on(() => {
          if (isMounted) {
            addLog("✅ Player Ready!");
            setIsReady(true);
          }
        });
        
        initApi.soundFontLoaded.on(() => {
          if (isMounted) addLog("✅ SoundFont Loaded!");
        });

        initApi.error.on((e: any) => {
          if (isMounted) addError("AlphaTab Error", e);
        });
        
        initApi.playerStateChanged.on((e: any) => {
          if (isMounted) {
            addLog(`Player State: ${e.state}`);
            setIsPlaying(e.state === 1);
          }
        });
        
        initApi.playerPositionChanged.on((e: any) => {
          if (isMounted) setProgress((e.currentTime / e.endTime) * 100);
        });

        initApi.scoreLoaded.on((score: any) => {
          if (isMounted) {
            addLog(`✅ Score Loaded: ${score.title}`);
            setTracks(score.tracks);
          }
        });

        initApi.renderFinished.on(() => {
           if (isMounted) addLog("✅ Render Finished");
        });

        setTimeout(() => {
          if (!isMounted) return;
          addLog(`Loading Data (${fileData.byteLength} bytes)...`);
          try {
            initApi.load(new Uint8Array(fileData));
          } catch (loadErr: any) {
            addError("Load failed", loadErr);
          }
        }, 500); 
        
        apiRef.current = initApi;
      } catch (err: any) {
        addError("Init failed", err);
      }
    };

    startAlphaTab();

    return () => {
      isMounted = false;
      if (apiRef.current) {
        apiRef.current.destroy();
        apiRef.current = null;
      }
    };
  }, [fileData]);

  const togglePlay = () => {
    if (!apiRef.current || !isReady) return;
    apiRef.current.playPause();
  };

  const stopPlay = () => {
    if (!apiRef.current || !isReady) return;
    apiRef.current.stop();
  };

  const changeTrack = (index: number) => {
    if (!apiRef.current || !isReady || !tracks[index]) return;
    setCurrentTrackIndex(index);
    apiRef.current.renderTracks([tracks[index]]);
  };

  const changeSpeed = (newSpeed: number) => {
    if (!apiRef.current || !isReady) return;
    setSpeed(newSpeed);
    apiRef.current.playbackSpeed = newSpeed;
  };

  const toggleMetronome = () => {
    if (!apiRef.current || !isReady) return;
    const newState = !isMetronomeActive;
    setIsMetronomeActive(newState);
    apiRef.current.metronomeVolume = newState ? 1 : 0;
  };

  const toggleLoop = () => {
    if (!apiRef.current || !isReady) return;
    const newState = !isLooping;
    setIsLooping(newState);
    apiRef.current.isLooping = newState;
  };

  if (!fileData) return null;

  return (
    <div className="w-full max-w-5xl bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl mt-8 border border-white/10 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-white/10 bg-black/40 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <h2 className="text-lg font-semibold text-white/90 truncate max-w-[200px]">{fileName}</h2>
          
          {/* Track Selector */}
          {tracks.length > 0 && (
            <div className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Settings2 className="w-4 h-4 text-violet-400" />
              <select 
                value={currentTrackIndex}
                onChange={(e) => changeTrack(parseInt(e.target.value))}
                className="bg-transparent text-white/80 text-sm focus:outline-none cursor-pointer hover:text-white transition-colors"
              >
                {tracks.map((track, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900">{track.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Speed Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 mr-2">
            <Gauge className="w-4 h-4 text-violet-400" />
            <select 
              value={speed}
              onChange={(e) => changeSpeed(parseFloat(e.target.value))}
              className="bg-transparent text-white/80 text-sm focus:outline-none cursor-pointer hover:text-white transition-colors"
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}x</option>
              ))}
            </select>
          </div>

          {/* Metronome & Loop Toggles */}
          <button 
            onClick={toggleMetronome}
            className={`p-2.5 rounded-xl border transition-all ${isMetronomeActive ? 'bg-violet-600/30 border-violet-500 text-violet-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
            title="Metronome"
          >
            <BellRing className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleLoop}
            className={`p-2.5 rounded-xl border transition-all ${isLooping ? 'bg-violet-600/30 border-violet-500 text-violet-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
            title="Loop"
          >
            <Repeat className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Core Controls */}
          {!isReady && (
            <div className="flex items-center text-violet-400 text-sm mr-2 gap-2">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          )}
          
          <button 
            onClick={togglePlay} 
            disabled={!isReady}
            className="p-3 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20 text-white"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button 
            onClick={stopPlay} 
            disabled={!isReady}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 text-white"
            title="Stop"
          >
            <Square className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/10 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* AlphaTab container */}
      <div className="p-4 sm:p-8 bg-white shadow-inner">
        <div ref={containerRef} className="w-full min-h-[700px] overflow-auto text-black custom-scrollbar bg-white rounded-lg"></div>
      </div>
    </div>
  );
}
