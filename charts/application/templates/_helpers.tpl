{{- define "cicada-sense.component.fullname" -}}
{{- $baseName := default .root.Release.Name .root.Values.global.fullnameOverride -}}
{{- printf "%s-%s" $baseName .component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "cicada-sense.component.chartLabel" -}}
{{- printf "%s-%s" .chart.Name (.chart.Version | replace "+" "_") | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "cicada-sense.component.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/component: {{ .component }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- end -}}

{{- define "cicada-sense.component.labels" -}}
{{ include "cicada-sense.component.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
app.kubernetes.io/part-of: {{ default "cicada-sense" .root.Values.global.partOf }}
helm.sh/chart: {{ include "cicada-sense.component.chartLabel" . }}
{{- with .chart.AppVersion }}
app.kubernetes.io/version: {{ . | quote }}
{{- end }}
{{- with .root.Values.global.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- with .values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.annotations" -}}
{{- with .root.Values.global.commonAnnotations }}
{{ toYaml . }}
{{- end }}
{{- with .values.commonAnnotations }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.serviceAccountName" -}}
{{- if .values.serviceAccount.create -}}
{{- default (include "cicada-sense.component.fullname" .) .values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "cicada-sense.component.image" -}}
{{- $rawImage := .values.image -}}
{{- if kindIs "string" $rawImage -}}
{{- $rawImage -}}
{{- else -}}
{{- $image := $rawImage | default dict -}}
{{- $registry := $image.registry | default .root.Values.global.imageRegistry -}}
{{- $repository := $image.repository | default "" -}}
{{- $imageName := ternary (printf "%s/%s" (trimSuffix "/" $registry) $repository) $repository (ne $registry "") -}}
{{- if $image.digest -}}
{{- printf "%s@%s" $imageName $image.digest -}}
{{- else -}}
{{- printf "%s:%s" $imageName ($image.tag | default .chart.AppVersion) -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "cicada-sense.component.imagePullPolicy" -}}
{{- $rawImage := .values.image -}}
{{- if kindIs "map" $rawImage -}}
{{- $rawImage.pullPolicy | default "IfNotPresent" -}}
{{- else -}}
IfNotPresent
{{- end -}}
{{- end -}}

{{- define "cicada-sense.component.testImage" -}}
{{- $registry := .values.tests.image.registry -}}
{{- $repository := .values.tests.image.repository -}}
{{- $imageName := ternary (printf "%s/%s" (trimSuffix "/" $registry) $repository) $repository (ne $registry "") -}}
{{- if .values.tests.image.digest -}}
{{- printf "%s@%s" $imageName .values.tests.image.digest -}}
{{- else -}}
{{- printf "%s:%s" $imageName .values.tests.image.tag -}}
{{- end -}}
{{- end -}}

{{- define "cicada-sense.component.containerPort" -}}
{{- default .values.service.port .values.containerPort -}}
{{- end -}}

{{- define "cicada-sense.component.renderEnv" -}}
{{- $root := .root -}}
{{- range .values.env }}
- name: {{ .name }}
  {{- if hasKey . "valueFrom" }}
  valueFrom:
{{ toYaml .valueFrom | nindent 4 }}
  {{- else if kindIs "string" .value }}
  value: {{ tpl .value $root | quote }}
  {{- else }}
  value: {{ .value | quote }}
  {{- end }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.serviceAccount" -}}
{{- if .values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "cicada-sense.component.serviceAccountName" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
  {{- $annotations := include "cicada-sense.component.annotations" . }}
  {{- if or $annotations .values.serviceAccount.annotations }}
  annotations:
{{- if $annotations }}
{{ $annotations | nindent 4 }}
{{- end }}
{{- with .values.serviceAccount.annotations }}
{{ toYaml . | nindent 4 }}
{{- end }}
  {{- end }}
automountServiceAccountToken: {{ .values.serviceAccount.automountServiceAccountToken }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
  {{- $annotations := include "cicada-sense.component.annotations" . }}
  {{- if $annotations }}
  annotations:
{{ $annotations | nindent 4 }}
  {{- end }}
spec:
  revisionHistoryLimit: {{ .values.revisionHistoryLimit }}
  {{- if not .values.autoscaling.enabled }}
  replicas: {{ .values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
{{ include "cicada-sense.component.selectorLabels" . | nindent 6 }}
  strategy:
{{ toYaml .values.strategy | nindent 4 }}
  template:
    metadata:
      labels:
{{ include "cicada-sense.component.selectorLabels" . | nindent 8 }}
{{- with .values.podLabels }}
{{ toYaml . | nindent 8 }}
{{- end }}
      {{- if or .values.podAnnotations $annotations }}
      annotations:
        {{- if $annotations }}
{{ $annotations | nindent 8 }}
        {{- end }}
{{- with .values.podAnnotations }}
{{ toYaml . | nindent 8 }}
{{- end }}
      {{- end }}
    spec:
      serviceAccountName: {{ include "cicada-sense.component.serviceAccountName" . }}
      automountServiceAccountToken: {{ .values.serviceAccount.automountServiceAccountToken }}
      terminationGracePeriodSeconds: {{ .values.terminationGracePeriodSeconds }}
      {{- $pullSecrets := .values.imagePullSecrets | default .root.Values.global.imagePullSecrets }}
      {{- with $pullSecrets }}
      imagePullSecrets:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with .values.podSecurityContext }}
      securityContext:
    {{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with .values.nodeSelector }}
      nodeSelector:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with .values.affinity }}
      affinity:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with .values.tolerations }}
      tolerations:
{{ toYaml . | nindent 8 }}
      {{- end }}
      {{- with .values.topologySpreadConstraints }}
      topologySpreadConstraints:
{{ toYaml . | nindent 8 }}
      {{- end }}
{{- with .values.volumes }}
      volumes:
{{ toYaml . | nindent 8 }}
{{- end }}
      containers:
        - name: {{ .component }}
          image: {{ include "cicada-sense.component.image" . }}
          imagePullPolicy: {{ include "cicada-sense.component.imagePullPolicy" . }}
{{- with .values.command }}
          command:
{{ toYaml . | nindent 12 }}
{{- end }}
{{- with .values.args }}
          args:
{{ toYaml . | nindent 12 }}
{{- end }}
          ports:
            - name: http
              containerPort: {{ include "cicada-sense.component.containerPort" . }}
              protocol: TCP
{{- if .values.env }}
          env:
{{ include "cicada-sense.component.renderEnv" . | nindent 12 }}
{{- end }}
{{- with .values.envFrom }}
          envFrom:
{{ toYaml . | nindent 12 }}
{{- end }}
{{- $livenessProbe := .values.probes.liveness | default dict }}
{{- if $livenessProbe.enabled }}
          livenessProbe:
{{ toYaml (omit $livenessProbe "enabled") | nindent 12 }}
{{- end }}
{{- $readinessProbe := .values.probes.readiness | default dict }}
{{- if $readinessProbe.enabled }}
          readinessProbe:
{{ toYaml (omit $readinessProbe "enabled") | nindent 12 }}
{{- end }}
{{- $startupProbe := .values.probes.startup | default dict }}
{{- if $startupProbe.enabled }}
          startupProbe:
{{ toYaml (omit $startupProbe "enabled") | nindent 12 }}
{{- end }}
          resources:
{{ toYaml .values.resources | nindent 12 }}
          securityContext:
{{ toYaml .values.containerSecurityContext | nindent 12 }}
{{- with .values.volumeMounts }}
          volumeMounts:
{{ toYaml . | nindent 12 }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.service" -}}
{{- if .values.service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
{{- with .values.service.annotations }}
  annotations:
{{ toYaml . | nindent 4 }}
{{- end }}
spec:
  type: {{ .values.service.type }}
  sessionAffinity: {{ .values.service.sessionAffinity }}
  selector:
{{ include "cicada-sense.component.selectorLabels" . | nindent 4 }}
  ports:
    - name: http
      port: {{ .values.service.port }}
      targetPort: {{ .values.service.targetPort }}
      protocol: TCP
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.pdb" -}}
{{- if .values.podDisruptionBudget.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
{{ include "cicada-sense.component.selectorLabels" . | nindent 6 }}
  {{- if hasKey .values.podDisruptionBudget "minAvailable" }}
  minAvailable: {{ .values.podDisruptionBudget.minAvailable }}
  {{- end }}
  {{- if hasKey .values.podDisruptionBudget "maxUnavailable" }}
  maxUnavailable: {{ .values.podDisruptionBudget.maxUnavailable }}
  {{- end }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.hpa" -}}
{{- if .values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "cicada-sense.component.fullname" . }}
  minReplicas: {{ .values.autoscaling.minReplicas }}
  maxReplicas: {{ .values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .values.autoscaling.targetCPUUtilizationPercentage }}
    {{- if .values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.ingress" -}}
{{- if and .values.ingress.enabled .values.service.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
{{- with .values.ingress.annotations }}
  annotations:
{{ toYaml . | nindent 4 }}
{{- end }}
spec:
{{- with .values.ingress.className }}
  ingressClassName: {{ . }}
{{- end }}
  rules:
{{- range .values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
{{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "cicada-sense.component.fullname" $ }}
                port:
                  number: {{ $.values.service.port }}
{{- end }}
{{- end }}
{{- with .values.ingress.tls }}
  tls:
{{ toYaml . | nindent 4 }}
{{- end }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.networkPolicy" -}}
{{- if .values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
{{ include "cicada-sense.component.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
{{- if .values.networkPolicy.allowSameNamespace }}
        - podSelector: {}
{{- end }}
{{- with .values.networkPolicy.extraIngress }}
{{ toYaml . | nindent 8 }}
{{- end }}
      ports:
        - protocol: TCP
          port: {{ .values.service.port }}
  egress:
{{- if .values.networkPolicy.allowSameNamespace }}
    - to:
        - podSelector: {}
{{- end }}
{{- if .values.networkPolicy.allowDns }}
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
{{- end }}
{{- with .values.networkPolicy.extraEgress }}
{{ toYaml . | nindent 4 }}
{{- end }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.testPod" -}}
{{- if and .values.tests.enabled .values.service.enabled }}
apiVersion: v1
kind: Pod
metadata:
  name: {{ include "cicada-sense.component.fullname" . }}-smoke
  labels:
{{ include "cicada-sense.component.labels" . | nindent 4 }}
  annotations:
    helm.sh/hook: test
    helm.sh/hook-delete-policy: before-hook-creation
spec:
  restartPolicy: Never
  automountServiceAccountToken: false
  containers:
    - name: smoke
      image: {{ include "cicada-sense.component.testImage" . }}
      imagePullPolicy: {{ .values.tests.image.pullPolicy }}
      command:
        - /bin/sh
        - -ec
        - >-
          wget -q -O /dev/null
          http://{{ include "cicada-sense.component.fullname" . }}:{{ .values.service.port }}{{ .values.tests.path }}
{{- end }}
{{- end -}}

{{- define "cicada-sense.component.manifests" -}}
{{- $serviceAccount := include "cicada-sense.component.serviceAccount" . | trim -}}
{{- if $serviceAccount }}
{{ printf "%s\n" $serviceAccount }}
{{- end }}
{{- $service := include "cicada-sense.component.service" . | trim -}}
{{- if $service }}
{{ printf "---\n%s\n" $service }}
{{- end }}
{{- $deployment := include "cicada-sense.component.deployment" . | trim -}}
{{- if $deployment }}
{{ printf "---\n%s\n" $deployment }}
{{- end }}
{{- $pdb := include "cicada-sense.component.pdb" . | trim -}}
{{- if $pdb }}
{{ printf "---\n%s\n" $pdb }}
{{- end }}
{{- $hpa := include "cicada-sense.component.hpa" . | trim -}}
{{- if $hpa }}
{{ printf "---\n%s\n" $hpa }}
{{- end }}
{{- $ingress := include "cicada-sense.component.ingress" . | trim -}}
{{- if $ingress }}
{{ printf "---\n%s\n" $ingress }}
{{- end }}
{{- $networkPolicy := include "cicada-sense.component.networkPolicy" . | trim -}}
{{- if $networkPolicy }}
{{ printf "---\n%s\n" $networkPolicy }}
{{- end }}
{{- $testPod := include "cicada-sense.component.testPod" . | trim -}}
{{- if $testPod }}
{{ printf "---\n%s\n" $testPod }}
{{- end }}
{{- end -}}
