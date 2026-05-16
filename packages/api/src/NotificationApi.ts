import { ApiClient } from "./ApiClient";
import type { NotificationLog } from "@syncoboard/types";

export class NotificationApi extends ApiClient {
  constructor() {
    super("/api/notifications");
  }

  public async getNotifications() {
    const response = await this.get<{ logs: NotificationLog[] }>("");
    return response.data;
  }

  public async getReadState() {
    const response = await this.get<{ lastRead: string | null }>("/read");
    return response.data;
  }

  public async markAsRead() {
    const response = await this.post<{ success: boolean }>("/read");
    return response.data;
  }
}

export const notificationApi = new NotificationApi();
