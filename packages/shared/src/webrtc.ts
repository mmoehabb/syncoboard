// In-memory global store for WebRTC signaling
type Signal = {
  peerId: string;
  signal: {
    type: string;
    data: string;
  };
};

type BoardSignals = Map<string, Signal[]>;

const globalSignals = new Map<string, BoardSignals>();

export const signalStore = {
  addSignal: (boardId: string, toPeerId: string, signal: Signal) => {
    if (!globalSignals.has(boardId)) {
      globalSignals.set(boardId, new Map());
    }
    const boardSignals = globalSignals.get(boardId)!;
    if (!boardSignals.has(toPeerId)) {
      boardSignals.set(toPeerId, []);
    }
    boardSignals.get(toPeerId)!.push(signal);
  },
  consumeSignals: (boardId: string, peerId: string): Signal[] => {
    const boardSignals = globalSignals.get(boardId);
    if (!boardSignals) return [];
    const signals = boardSignals.get(peerId) || [];
    boardSignals.delete(peerId);
    return signals;
  },
  clearBoard: (boardId: string) => {
    globalSignals.delete(boardId);
  },
};
