import type { DashboardBootstrap } from "../../domain/model.js";

const DEFAULT_ORGANIZATION_ID = import.meta.env.VITE_DEFAULT_ORGANIZATION_ID ?? "org-cicada-lab";

export class DashboardClient {
  public constructor(
    private readonly baseUrl = "",
    private readonly organizationId = DEFAULT_ORGANIZATION_ID,
  ) {}

  public async getBootstrap(): Promise<DashboardBootstrap> {
    const response = await fetch(`${this.baseUrl}/api/bootstrap`, {
      headers: { "x-organization-id": this.organizationId },
    });
    if (!response.ok) {
      throw new Error("DASHBOARD_BOOTSTRAP_FAILED");
    }

    return (await response.json()) as DashboardBootstrap;
  }
}
