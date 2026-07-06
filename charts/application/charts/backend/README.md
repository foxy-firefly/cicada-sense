# backend

![Version: 0.0.0](https://img.shields.io/badge/Version-0.0.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.0.0](https://img.shields.io/badge/AppVersion-0.0.0-informational?style=flat-square)

Cicada Sense backend API workload

## Values

| Key                                               | Type   | Default                      | Description |
| ------------------------------------------------- | ------ | ---------------------------- | ----------- |
| affinity                                          | object | `{}`                         |             |
| args                                              | list   | `[]`                         |             |
| autoscaling.enabled                               | bool   | `false`                      |             |
| autoscaling.maxReplicas                           | int    | `6`                          |             |
| autoscaling.minReplicas                           | int    | `2`                          |             |
| autoscaling.targetCPUUtilizationPercentage        | int    | `80`                         |             |
| autoscaling.targetMemoryUtilizationPercentage     | string | `nil`                        |             |
| command                                           | list   | `[]`                         |             |
| commonAnnotations                                 | object | `{}`                         |             |
| commonLabels                                      | object | `{}`                         |             |
| containerPort                                     | int    | `3000`                       |             |
| containerSecurityContext.allowPrivilegeEscalation | bool   | `false`                      |             |
| containerSecurityContext.capabilities.drop[0]     | string | `"ALL"`                      |             |
| containerSecurityContext.privileged               | bool   | `false`                      |             |
| containerSecurityContext.readOnlyRootFilesystem   | bool   | `false`                      |             |
| containerSecurityContext.runAsNonRoot             | bool   | `true`                       |             |
| enabled                                           | bool   | `true`                       |             |
| envFrom                                           | list   | `[]`                         |             |
| env[0].name                                       | string | `"PORT"`                     |             |
| env[0].value                                      | string | `"3000"`                     |             |
| image.digest                                      | string | `""`                         |             |
| image.pullPolicy                                  | string | `"IfNotPresent"`             |             |
| image.registry                                    | string | `"ghcr.io"`                  |             |
| image.repository                                  | string | `"cicada-sense/backend"`     |             |
| image.tag                                         | string | `"0.1.0"`                    |             |
| imagePullSecrets                                  | list   | `[]`                         |             |
| ingress.annotations                               | object | `{}`                         |             |
| ingress.className                                 | string | `""`                         |             |
| ingress.enabled                                   | bool   | `false`                      |             |
| ingress.hosts[0].host                             | string | `"cicada-sense.example.com"` |             |
| ingress.hosts[0].paths[0].path                    | string | `"/api"`                     |             |
| ingress.hosts[0].paths[0].pathType                | string | `"Prefix"`                   |             |
| ingress.tls                                       | list   | `[]`                         |             |
| networkPolicy.allowDns                            | bool   | `true`                       |             |
| networkPolicy.allowSameNamespace                  | bool   | `true`                       |             |
| networkPolicy.enabled                             | bool   | `true`                       |             |
| networkPolicy.extraEgress                         | list   | `[]`                         |             |
| networkPolicy.extraIngress                        | list   | `[]`                         |             |
| nodeSelector                                      | object | `{}`                         |             |
| podAnnotations                                    | object | `{}`                         |             |
| podDisruptionBudget.enabled                       | bool   | `true`                       |             |
| podDisruptionBudget.minAvailable                  | int    | `1`                          |             |
| podLabels                                         | object | `{}`                         |             |
| podSecurityContext.fsGroup                        | int    | `10001`                      |             |
| podSecurityContext.fsGroupChangePolicy            | string | `"OnRootMismatch"`           |             |
| podSecurityContext.runAsGroup                     | int    | `10001`                      |             |
| podSecurityContext.runAsNonRoot                   | bool   | `true`                       |             |
| podSecurityContext.runAsUser                      | int    | `10001`                      |             |
| podSecurityContext.seccompProfile.type            | string | `"RuntimeDefault"`           |             |
| probes.liveness.enabled                           | bool   | `true`                       |             |
| probes.liveness.failureThreshold                  | int    | `3`                          |             |
| probes.liveness.httpGet.path                      | string | `"/health"`                  |             |
| probes.liveness.httpGet.port                      | string | `"http"`                     |             |
| probes.liveness.initialDelaySeconds               | int    | `10`                         |             |
| probes.liveness.periodSeconds                     | int    | `10`                         |             |
| probes.liveness.timeoutSeconds                    | int    | `5`                          |             |
| probes.readiness.enabled                          | bool   | `true`                       |             |
| probes.readiness.failureThreshold                 | int    | `3`                          |             |
| probes.readiness.httpGet.path                     | string | `"/health"`                  |             |
| probes.readiness.httpGet.port                     | string | `"http"`                     |             |
| probes.readiness.initialDelaySeconds              | int    | `5`                          |             |
| probes.readiness.periodSeconds                    | int    | `10`                         |             |
| probes.readiness.timeoutSeconds                   | int    | `5`                          |             |
| probes.startup.enabled                            | bool   | `true`                       |             |
| probes.startup.failureThreshold                   | int    | `12`                         |             |
| probes.startup.httpGet.path                       | string | `"/health"`                  |             |
| probes.startup.httpGet.port                       | string | `"http"`                     |             |
| probes.startup.initialDelaySeconds                | int    | `0`                          |             |
| probes.startup.periodSeconds                      | int    | `5`                          |             |
| probes.startup.timeoutSeconds                     | int    | `5`                          |             |
| replicaCount                                      | int    | `1`                          |             |
| resources                                         | object | `{}`                         |             |
| revisionHistoryLimit                              | int    | `10`                         |             |
| service.annotations                               | object | `{}`                         |             |
| service.enabled                                   | bool   | `true`                       |             |
| service.port                                      | int    | `3000`                       |             |
| service.sessionAffinity                           | string | `"None"`                     |             |
| service.targetPort                                | string | `"http"`                     |             |
| service.type                                      | string | `"ClusterIP"`                |             |
| serviceAccount.annotations                        | object | `{}`                         |             |
| serviceAccount.automountServiceAccountToken       | bool   | `false`                      |             |
| serviceAccount.create                             | bool   | `true`                       |             |
| serviceAccount.name                               | string | `""`                         |             |
| strategy.rollingUpdate.maxSurge                   | int    | `1`                          |             |
| strategy.rollingUpdate.maxUnavailable             | int    | `0`                          |             |
| strategy.type                                     | string | `"RollingUpdate"`            |             |
| terminationGracePeriodSeconds                     | int    | `30`                         |             |
| tests.enabled                                     | bool   | `true`                       |             |
| tests.image.digest                                | string | `""`                         |             |
| tests.image.pullPolicy                            | string | `"IfNotPresent"`             |             |
| tests.image.registry                              | string | `"docker.io"`                |             |
| tests.image.repository                            | string | `"busybox"`                  |             |
| tests.image.tag                                   | string | `"1.37.0"`                   |             |
| tests.path                                        | string | `"/health"`                  |             |
| tolerations                                       | list   | `[]`                         |             |
| topologySpreadConstraints                         | list   | `[]`                         |             |
| volumeMounts                                      | list   | `[]`                         |             |
| volumes                                           | list   | `[]`                         |             |

---

Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
