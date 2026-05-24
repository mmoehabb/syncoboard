import { voiceApi } from "@syncoboard/api";

class P2PVoiceService {
  private peer: any | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting: boolean = false;
  private boardId: string | null = null;

  async join(boardId: string, printOutput: (lines: string[]) => void, setIsVoiceCallActive?: (active: boolean) => void) {
    if (this.peer || this.isConnecting) {
      printOutput(["You are already in a voice call or connecting..."]);
      return;
    }

    this.isConnecting = true;
    this.boardId = boardId;

    try {
      // Dynamic import to prevent loading issues if PeerJS requires browser globals,
      // although we installed wrtc, peerjs may still complain if not initialized carefully.
      // We are writing a TODO here for the real audio task

      const { default: Peer } = await import("peerjs");

      // Node.js doesn't have WebRTC built-in, so we normally pass `wrtc` to PeerJS options
      // @ts-ignore
      const wrtc = (await import("wrtc")).default;

      printOutput(["Initializing WebRTC engine..."]);

      // Initialize peer
      this.peer = new Peer({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }, wrtc } as any);

      this.peer.on("open", async (id: string) => {
        printOutput([`WebRTC engine initialized. Joining board call (Peer ID: ${id})...`]);

        try {
          await voiceApi.join(boardId, id);
          printOutput([`Joined voice call for board: ${boardId}`]);

          if (setIsVoiceCallActive) {
            setIsVoiceCallActive(true);
          }

          // Fetch active peers
          const peers = await voiceApi.getActivePeers(boardId);
          printOutput([`Found ${peers.length} active peers.`]);

          // TODO: Implement actual audio stream generation/capture here
          // e.g. const stream = ...
          // peers.forEach(p => this.peer.call(p.voicePeerId, stream))

          this.startPolling(boardId);
          this.isConnecting = false;
        } catch (err: any) {
          printOutput([`Failed to join server: ${err.message}`]);
          this.leave(printOutput, setIsVoiceCallActive);
        }
      });

      this.peer.on("call", (call: any) => {
        printOutput([`Incoming call from ${call.peer}...`]);
        // TODO: Answer with our audio stream
        // call.answer(stream)

        call.on("stream", (remoteStream: any) => {
           printOutput([`Receiving stream from ${call.peer}. (Playback TODO)`]);
        });
      });

      this.peer.on("error", (err: any) => {
        printOutput([`PeerJS Error: ${err.type} - ${err.message}`]);
        this.isConnecting = false;
      });

    } catch (err: any) {
      printOutput([`Failed to initialize WebRTC: ${err.message}`]);
      this.isConnecting = false;
    }
  }

  async leave(printOutput: (lines: string[]) => void, setIsVoiceCallActive?: (active: boolean) => void) {
    if (!this.peer && !this.boardId) {
      printOutput(["You are not in a voice call."]);
      return;
    }

    printOutput(["Leaving voice call..."]);

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.boardId) {
      try {
        await voiceApi.leave(this.boardId);
      } catch (err) {
         // Ignore
      }
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.boardId = null;
    this.isConnecting = false;

    if (setIsVoiceCallActive) {
      setIsVoiceCallActive(false);
    }

    printOutput(["Left voice call."]);
  }

  private startPolling(boardId: string) {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      try {
        await voiceApi.ping(boardId);
        const peers = await voiceApi.getActivePeers(boardId);
        // TODO: Connect to new peers that we aren't connected to yet
      } catch (err) {
        // Ignore poll errors
      }
    }, 5000);
  }
}

export const p2pVoiceService = new P2PVoiceService();
