import { ApiClient } from "./ApiClient";

export class UserApi extends ApiClient {
  constructor(baseURL = "/api/user") {
    super(baseURL);
  }

  public async updateLastOnline(): Promise<void> {
    await this.post("/activity");
  }
}
