import "reflect-metadata";
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Post, UseFilters } from "@nestjs/common";
import { BACKEND_OBSERVABILITY, type BackendObservabilityPort } from "../../application/backend-observability-port.js";
import { CicadaSenseService, type DetectionInput } from "../../application/cicada-sense-service.js";
import { DomainError, ErrorCode } from "../../domain/error-codes.js";
import { DomainErrorFilter } from "./domain-error.filter.js";
import { MonitoringBootstrapProjector } from "./monitoring-bootstrap-projector.js";

@Controller()
@UseFilters(new DomainErrorFilter())
export class CicadaController {
  public constructor(
    @Inject(CicadaSenseService) private readonly cicadaSenseService: CicadaSenseService,
    @Inject(BACKEND_OBSERVABILITY) private readonly observability: BackendObservabilityPort,
  ) {}

  @Get("health")
  public async getHealth() {
    const bootstrap = await this.cicadaSenseService.getBootstrap();
    return this.observability.health(bootstrap.sourceHealth.length);
  }

  @Get("api/health/live")
  public async getLiveHealth() {
    return this.getHealth();
  }

  @Get("api/bootstrap")
  public async getBootstrap(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return MonitoringBootstrapProjector.project(await this.cicadaSenseService.getBootstrap());
  }

  @Get("api/organizations")
  public async getOrganizations(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return this.cicadaSenseService.listOrganizations();
  }

  @Get("api/projects")
  public async getProjects(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return this.cicadaSenseService.listProjects();
  }

  @Get("api/sites")
  public async getSites(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return this.cicadaSenseService.listSites();
  }

  @Get("api/sensors")
  public async getSensors(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return this.cicadaSenseService.listSensors();
  }

  @Get("api/source-health")
  public async getSourceHealth(@Headers("x-organization-id") organizationId?: string) {
    await this.assertTenantAccess(organizationId);
    return this.cicadaSenseService.listSourceHealth();
  }

  @Get("metrics")
  public getMetrics() {
    return this.observability.metrics();
  }

  @Post("api/ingest/detections")
  @HttpCode(HttpStatus.ACCEPTED)
  public async ingestDetection(
    @Body() input: DetectionInput,
    @Headers("x-request-id") requestId = "unknown",
    @Headers("x-organization-id") organizationId?: string,
  ) {
    const authorizedOrganizationId = await this.assertTenantAccess(organizationId);
    if (authorizedOrganizationId !== input.organizationId) {
      throw new DomainError(ErrorCode.TenantMismatch, "ingestion organization does not match authorized tenant");
    }

    const result = await this.cicadaSenseService.ingestDetection(input);
    this.observability.recordDetectionIngested(requestId, result.detection.sensorId);
    return result;
  }

  private async assertTenantAccess(organizationId?: string): Promise<string> {
    if (!organizationId) {
      throw new DomainError(ErrorCode.TenantMismatch, "x-organization-id header is required");
    }

    const organizations = await this.cicadaSenseService.listOrganizations();
    if (!organizations.some((organization) => organization.id === organizationId)) {
      throw new DomainError(ErrorCode.TenantMismatch, `unknown tenant ${organizationId}`);
    }

    return organizationId;
  }
}
