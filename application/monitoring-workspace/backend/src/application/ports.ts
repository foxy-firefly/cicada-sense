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

export interface CicadaRepository {
  loadDataset(dataset: CicadaDataset): Promise<void>;
  listOrganizations(): Promise<Organization[]>;
  listProjects(): Promise<Project[]>;
  listSites(): Promise<Site[]>;
  listSensors(): Promise<Sensor[]>;
  listSpecies(): Promise<Species[]>;
  listDetections(): Promise<Detection[]>;
  listSourceHealth(): Promise<SourceHealth[]>;
  listAlerts(): Promise<Alert[]>;
  saveDetection(detection: Detection): Promise<void>;
  saveSourceHealth(sourceHealth: SourceHealth): Promise<void>;
  saveAlert(alert: Alert): Promise<void>;
}

export interface RealtimePublisher {
  publishDetection(detection: Detection): void;
  publishAlert(alert: Alert): void;
}

export interface SourceFreshnessRuntime {
  listSourceHealth(): Promise<SourceHealth[]>;
  saveSourceHealth(sourceHealth: SourceHealth): Promise<void>;
}
