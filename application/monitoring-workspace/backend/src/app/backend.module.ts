import "reflect-metadata";
import { type DynamicModule, Module } from "@nestjs/common";
import { BACKEND_OBSERVABILITY } from "../application/backend-observability-port.js";
import { CicadaSenseService } from "../application/cicada-sense-service.js";
import type { BackendObservability } from "../infrastructure/observability.js";
import { CicadaController } from "../presentation/http/cicada.controller.js";
import { RealtimeSocketBridge } from "../presentation/realtime/realtime-socket-bridge.js";

@Module({})
export class BackendModule {
  public static register(cicadaSenseService: CicadaSenseService, observability: BackendObservability): DynamicModule {
    return {
      module: BackendModule,
      controllers: [CicadaController],
      providers: [
        RealtimeSocketBridge,
        {
          provide: BACKEND_OBSERVABILITY,
          useValue: observability,
        },
        {
          provide: CicadaSenseService,
          useValue: cicadaSenseService,
        },
      ],
    };
  }
}
