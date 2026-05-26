import { ApiClient } from "./ApiClient";

export class VoiceApi extends ApiClient {
  constructor() {
    super("/api/voice");
  }

  public async join(
    boardId: string,
    peerId: string,
  ): Promise<{ success: boolean }> {
    const response = await this.post<{ success: boolean }>("/join", {
      boardId,
      peerId,
    });
    return response.data;
  }

  public async leave(boardId: string): Promise<{ success: boolean }> {
    const response = await this.post<{ success: boolean }>("/leave", {
      boardId,
    });
    return response.data;
  }

  public async getActivePeers(boardId: string): Promise<any[]> {
    const response = await this.get<{ peers: any[] }>("/active", {
      params: { boardId },
    });
    return response.data.peers;
  }

  public async ping(boardId: string): Promise<{ success: boolean }> {
    const response = await this.post<{ success: boolean }>("/ping", {
      boardId,
    });
    return response.data;
  }
}

export const voiceApi = new VoiceApi();
