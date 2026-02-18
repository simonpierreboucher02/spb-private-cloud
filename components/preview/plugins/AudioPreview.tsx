"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Gauge } from "lucide-react";
import type { PreviewPluginProps } from "./types";

export default function AudioPreview({ file }: PreviewPluginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ws: any = null;

    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;

        if (!containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: "#4b5563",
          progressColor: "#9ca3af",
          cursorColor: "#ffffff",
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 120,
          normalize: true,
          url: `/api/files/${file.id}/stream`,
        });

        ws.on("ready", () => {
          setDuration(ws.getDuration());
          setLoading(false);
          ws.setVolume(volume);
        });

        ws.on("audioprocess", () => {
          setCurrentTime(ws.getCurrentTime());
        });

        ws.on("seeking", () => {
          setCurrentTime(ws.getCurrentTime());
        });

        ws.on("finish", () => {
          setIsPlaying(false);
        });

        ws.on("error", () => {
          setError(true);
          setLoading(false);
        });

        wavesurferRef.current = ws;
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    initWaveSurfer();

    return () => {
      if (ws) ws.destroy();
    };
  }, [file.id]);

  const togglePlay = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.playPause();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const newMuted = !isMuted;
    ws.setVolume(newMuted ? 0 : volume);
    setIsMuted(newMuted);
  }, [isMuted, volume]);

  const changeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const vol = parseFloat(e.target.value);
    ws.setVolume(vol);
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const cycleSpeed = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackRate(next);
    ws.setPlaybackRate(next);
  }, [playbackRate]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-gray-400 mb-4">Lecteur audio</p>
        <audio src={`/api/files/${file.id}/stream`} controls className="w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      {/* File info */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Volume2 className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">{file.name}</p>
      </div>

      {/* Waveform */}
      <div className="w-full max-w-lg">
        {loading && (
          <div className="flex items-center justify-center h-[120px]">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className={loading ? "hidden" : ""} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={togglePlay} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <span className="text-xs text-gray-500 min-w-[5rem] text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button onClick={cycleSpeed} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          {playbackRate}x
        </button>

        <div className="flex items-center gap-1">
          <button onClick={toggleMute} className="text-gray-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={changeVolume}
            className="w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
}
