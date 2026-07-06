import type { CicadaRepository } from "../application/ports.js";
import type {
  Alert,
  CicadaDataset,
  Detection,
  Organization,
  Project,
  Sensor,
  Site,
  SourceHealth,
  Species,
} from "../domain/model.js";

export class InMemoryCicadaRepository implements CicadaRepository {
  private organizations: Organization[] = [];
  private projects: Project[] = [];
  private sites: Site[] = [];
  private sensors: Sensor[] = [];
  private species: Species[] = [];
  private detections: Detection[] = [];
  private sourceHealth: SourceHealth[] = [];
  private alerts: Alert[] = [];

  public async loadDataset(dataset: CicadaDataset): Promise<void> {
    this.organizations = [...dataset.organizations];
    this.projects = [...dataset.projects];
    this.sites = [...dataset.sites];
    this.sensors = [...dataset.sensors];
    this.species = [...dataset.species];
    this.detections = [...dataset.detections];
    this.sourceHealth = [...dataset.sourceHealth];
    this.alerts = [...dataset.alerts];
  }

  public async listOrganizations(): Promise<Organization[]> {
    return [...this.organizations];
  }

  public async listProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  public async listSites(): Promise<Site[]> {
    return [...this.sites];
  }

  public async listSensors(): Promise<Sensor[]> {
    return [...this.sensors];
  }

  public async listSpecies(): Promise<Species[]> {
    return [...this.species];
  }

  public async listDetections(): Promise<Detection[]> {
    return [...this.detections];
  }

  public async listSourceHealth(): Promise<SourceHealth[]> {
    return [...this.sourceHealth];
  }

  public async listAlerts(): Promise<Alert[]> {
    return [...this.alerts];
  }

  public async saveDetection(detection: Detection): Promise<void> {
    this.detections = this.detections
      .filter((currentDetection) => currentDetection.id !== detection.id)
      .concat(detection);
  }

  public async saveSourceHealth(sourceHealth: SourceHealth): Promise<void> {
    this.sourceHealth = this.sourceHealth
      .filter((currentHealth) => currentHealth.sourceId !== sourceHealth.sourceId)
      .concat(sourceHealth);
  }

  public async saveAlert(alert: Alert): Promise<void> {
    const alreadyExists = this.alerts.some((currentAlert) => currentAlert.id === alert.id);
    if (!alreadyExists) {
      this.alerts = [...this.alerts, alert];
    }
  }
}
