{{/*
Expand the name of the chart.
*/}}
{{- define "vanisec.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "vanisec.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "vanisec.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "vanisec.labels" -}}
helm.sh/chart: {{ include "vanisec.chart" . }}
{{ include "vanisec.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "vanisec.selectorLabels" -}}
app.kubernetes.io/name: {{ include "vanisec.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "vanisec.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "vanisec.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Variables this chart knows how to source from a Kubernetes Secret. The app reads
a fixed set of environment variables, so an entry outside this list would create
a Secret nothing ever reads. Keep it in step with secret.yaml and deployment.yaml.
*/}}
{{- define "vanisec.secretableEnv" -}}
REDIS_PASSWORD REDIS_URL
{{- end }}

{{/*
Name of the Secret that sensitive environment variables are read from, or the
empty string when none are. An operator-managed Secret is used as named; a
chart-managed one is named after the release.
*/}}
{{- define "vanisec.secretName" -}}
{{- $secrets := .Values.secrets | default dict -}}
{{- if $secrets.existingSecret -}}
{{- $secrets.existingSecret -}}
{{- else if $secrets.create -}}
{{- printf "%s-env" (include "vanisec.fullname" .) -}}
{{- end -}}
{{- end }}

{{/*
Environment variables that are delivered from a Secret, as a YAML map of
variable name to the key holding it inside that Secret. Renders nothing when no
Secret is in play, which is the default, so callers get an empty map.

With an existing Secret the chart cannot see what is inside it, so every mapped
name is taken at face value. With a chart-created Secret only names that have a
non-empty value in secrets.data are included, so a half-filled data block leaves
the rest on their normal plain-value path instead of pointing at a missing key.

Consume it as: $secretKeys := include "vanisec.secretEnvKeys" . | fromYaml
*/}}
{{- define "vanisec.secretEnvKeys" -}}
{{- $secrets := .Values.secrets | default dict -}}
{{- $keys := $secrets.keys | default dict -}}
{{- if $secrets.existingSecret -}}
{{- range $name, $key := $keys -}}
{{- if $key }}
{{ $name }}: {{ $key }}
{{- end -}}
{{- end -}}
{{- else if $secrets.create -}}
{{- $data := $secrets.data | default dict -}}
{{- range $name, $key := $keys -}}
{{- if and $key (index $data $name) }}
{{ $name }}: {{ $key }}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end }}

{{/*
Rejects secret configurations that are ambiguous or that would put the same
value in two places. Rendering stops with a message rather than picking a winner
silently, because every one of these cases means the values file says two
different things about one credential.
*/}}
{{- define "vanisec.validateSecrets" -}}
{{- $secrets := .Values.secrets | default dict -}}
{{- if and $secrets.create $secrets.existingSecret -}}
{{- fail "vanisec: secrets.create and secrets.existingSecret are mutually exclusive. Either let the chart create the Secret or point it at one you manage, not both." -}}
{{- end -}}
{{- $supported := splitList " " (include "vanisec.secretableEnv" .) -}}
{{- range $name, $key := ($secrets.keys | default dict) -}}
{{- if not (has $name $supported) -}}
{{- fail (printf "vanisec: secrets.keys lists %s, which the app does not read from a Secret. Supported names: %s" $name (join ", " $supported)) -}}
{{- end -}}
{{- end -}}
{{- $secretKeys := include "vanisec.secretEnvKeys" . | fromYaml -}}
{{- range $name, $key := $secretKeys -}}
{{- if index ($.Values.env | default dict) $name -}}
{{- fail (printf "vanisec: %s comes from a Secret, so it must not also be set in plain text. Set env.%s to \"\" in your values." $name $name) -}}
{{- end -}}
{{- if and (eq $name "REDIS_PASSWORD") ($.Values.redis.password) -}}
{{- fail "vanisec: REDIS_PASSWORD comes from a Secret, so redis.password must be empty. The embedded Redis reads the same Secret, so it stays password protected." -}}
{{- end -}}
{{- end -}}
{{- /* Turning secrets.create on without filling secrets.data leaves the value on
       the plain path. That renders exactly as before, which is the problem: the
       operator asked for a Secret, got none, and nothing said so. Fail instead.
       Only REDIS_PASSWORD is checked. REDIS_URL ships a non-empty chart default,
       so a plain value there says nothing about operator intent, and treating it
       as a forgotten secret would make secrets.create unusable on its own. */}}
{{- if $secrets.create -}}
{{- $data := $secrets.data | default dict -}}
{{- if not (index $data "REDIS_PASSWORD") -}}
{{- $plain := (index ($.Values.env | default dict) "REDIS_PASSWORD") | default $.Values.redis.password -}}
{{- if $plain -}}
{{- fail "vanisec: secrets.create is on but secrets.data.REDIS_PASSWORD is empty, so the password would still be rendered in plain text. Set secrets.data.REDIS_PASSWORD and clear the plain value, or turn secrets.create off." -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end }}
