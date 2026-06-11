"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type Peer from "peerjs";
import type { MediaConnection } from "peerjs";
import { Mic, MicOff, PhoneOff, Users } from "lucide-react";
import {
  joinVoiceCall,
  leaveVoiceCall,
  getActiveVoicePeers,
  pingVoiceCall,
} from "@/lib/actions/voice";
import { useCommand } from "@/context/CommandContext";

export function VoiceCallPanel({ boardId }: { boardId: string }) {
  const { setIsVoiceCallActive } = useCommand();
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePeersCount, setActivePeersCount] = useState(1);
  const [isConnecting, setIsConnecting] = useState(true);

  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callsRef = useRef<{ [peerId: string]: MediaConnection }>({});
  const audioContextRef = useRef<{ [peerId: string]: HTMLAudioElement }>({});

  const cleanup = useCallback(async () => {
    try {
      await leaveVoiceCall(boardId);
    } catch (err) {
      console.error("Failed to leave voice call gracefully", err);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    Object.values(callsRef.current).forEach((call) => call.close());
    callsRef.current = {};

    Object.values(audioContextRef.current).forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    audioContextRef.current = {};

    if (peerRef.current) {
      peerRef.current.destroy();
    }
  }, [boardId]);

  useEffect(() => {
    // Ping to keep alive
    const pingInterval = setInterval(() => {
      pingVoiceCall(boardId).catch(console.error);
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [boardId]);

  const handleCall = useCallback((call: MediaConnection) => {
    callsRef.current[call.peer] = call;

    call.on("stream", (remoteStream) => {
      if (!audioContextRef.current[call.peer]) {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch((e) => console.error("Audio play failed:", e));
        audioContextRef.current[call.peer] = audio;
      }
    });

    call.on("close", () => {
      if (audioContextRef.current[call.peer]) {
        audioContextRef.current[call.peer].pause();
        audioContextRef.current[call.peer].srcObject = null;
        delete audioContextRef.current[call.peer];
      }
      delete callsRef.current[call.peer];
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Note: we can't easily dynamically import Peer inside the useEffect since we need types and constructor,
        // so we use the static import but it might require checking window object if SSR is an issue.
        // In Next.js App router, 'use client' handles basic client side rendering, but PeerJS
        // sometimes accesses navigator at module load.
        const PeerModule = (await import("peerjs")).default;
        const peer = new PeerModule();

        peer.on("open", async (id: string) => {
          if (!mounted) return;
          setPeerId(id);
          peerRef.current = peer;

          try {
            await joinVoiceCall(boardId, id);

            // Fetch existing peers and connect
            const peers = await getActiveVoicePeers(boardId);
            setActivePeersCount(peers.length + 1);

            peers.forEach((p) => {
              if (p.voicePeerId && p.voicePeerId !== id) {
                const call = peer.call(p.voicePeerId, stream);
                handleCall(call);
              }
            });
            setIsConnecting(false);
          } catch (err) {
            console.error("Failed to register peer", err);
            setError("Failed to register peer with server.");
            setIsConnecting(false);
          }
        });

        peer.on("call", (call) => {
          call.answer(stream);
          handleCall(call);
        });

        peer.on("error", (err) => {
          console.error("PeerJS error:", err);
          setError(`Connection error: ${err.type}`);
          setIsConnecting(false);
        });
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setError("Microphone access is required for voice calls.");
        setIsConnecting(false);
      }
    };

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [boardId, cleanup, handleCall]);

  useEffect(() => {
    // Poll for new peers
    const pollInterval = setInterval(async () => {
      if (!peerRef.current || !streamRef.current || !peerId) return;

      try {
        const peers = await getActiveVoicePeers(boardId);
        setActivePeersCount(peers.length + 1);

        peers.forEach((p) => {
          if (
            p.voicePeerId &&
            p.voicePeerId !== peerId &&
            !callsRef.current[p.voicePeerId]
          ) {
            const call = peerRef.current!.call(
              p.voicePeerId,
              streamRef.current!,
            );
            handleCall(call);
          }
        });
      } catch (err) {
        console.error("Failed to poll peers", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [boardId, peerId, handleCall]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!streamRef.current.getAudioTracks()[0].enabled);
    }
  };

  const endCall = () => {
    setIsVoiceCallActive(false);
  };

  return (
    <div className="absolute right-0 top-16 h-[calc(100%-4rem)] w-80 border-l border-white/10 bg-obsidian-night/95 backdrop-blur-md p-6 flex flex-col transition-all overflow-y-auto z-40 shadow-[-4px_0_25px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-mono font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-pulse" />
          Voice Call
        </h2>
      </div>

      <div className="bg-obsidian-night border border-neon-pulse/30 p-4 rounded-md mb-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-neon-pulse/50"></div>
        <p className="text-syntax-grey font-mono text-xs leading-relaxed italic">
          This is a simple peer-to-peer session that&apos;s not guaranteed to be
          reliable all the time.
        </p>
      </div>

      {isConnecting ? (
        <div className="flex flex-col items-center justify-center h-40 gap-4 mb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-pulse"></div>
          <span className="text-syntax-grey font-mono text-sm animate-pulse">
            Connecting...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-syntax-grey">Status</span>
            <span className="text-git-green flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-git-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-git-green"></span>
              </span>
              Connected
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-syntax-grey">Participants</span>
            <span className="text-white">{activePeersCount}</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {!isConnecting && (
          <button
            onClick={toggleMute}
            className={`flex items-center justify-center gap-2 p-3 rounded-md font-mono text-sm transition-colors ${
              isMuted
                ? "bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20"
                : "bg-void-grey text-white border border-white/10 hover:border-white/30"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {isMuted ? "Unmute" : "Mute"}
          </button>
        )}
        <button
          onClick={endCall}
          className={`flex items-center justify-center gap-2 p-3 rounded-md font-mono text-sm transition-colors ${
            isConnecting
              ? "bg-void-grey text-white border border-white/10 hover:border-white/30"
              : "bg-red-400 text-obsidian-night font-bold hover:bg-red-500"
          }`}
        >
          {isConnecting ? (
            "Cancel"
          ) : (
            <>
              <PhoneOff className="w-4 h-4" />
              End Call
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-obsidian-night border border-red-400/50 p-4 rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-2 max-w-sm">
          <span className="text-red-400 font-mono font-bold text-sm">
            Connection Error
          </span>
          <span className="text-syntax-grey font-mono text-xs">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white/50 hover:text-white text-xs font-mono self-end mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
