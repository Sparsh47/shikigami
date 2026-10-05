# Shikigami AI Agent Platform Roadmap

## Current state

Shikigami currently implements the basic deployment skeleton:

```text
GitHub repository
  → BullMQ flow
  → Kaniko build
  → Docker registry
  → Kubernetes Deployment + Service + Ingress
  → build-log SSE
```

The repository is a Turborepo containing:

- A Next.js frontend.
- A Fastify API.
- BullMQ workers.
- Prisma/PostgreSQL persistence.
- Redis queues and event streaming.
- Kubernetes/Kaniko deployment primitives.
- GitHub OAuth and Docker Hub integration.

The current platform can queue a GitHub source context, build an image with Kaniko, push it to a registry, create one Kubernetes Deployment, and display build events. It is currently closer to a generic container deployment platform than a complete AI-agent deployment platform.

TypeScript checks currently pass across all workspaces.

Security-related issues are intentionally excluded from this document.

## Highest-priority implementation gaps

| Priority | Area | Missing functionality | Done |
|---|---|---|---|
| P0 | Deployment lifecycle | The UI calls `PATCH /api/deployments/:id/settings`, but the Fastify API has no corresponding settings route. Saving settings will fail. | Done |
| P0 | Environment variables | The UI exposes environment editing, but the backend route is `PATCH /:id/envs/update`; the Next.js proxy only implements `GET`. The update flow is incomplete. | Done |
| P0 | Dockerfile support | The Kaniko manifest always uses `Dockerfile`. `rootDir` and `pathOfDockerfile` exist partially but are not passed into the build job. | Not Done |
| P0 | Deployment readiness | Status becomes `READY` immediately after Kubernetes resources are submitted. It does not wait for the pod to become ready or expose a readiness failure. | Not Done |
| P0 | Runtime failures | There is no runtime status reconciliation after deployment. A pod can crash or become unavailable while the database continues to say `READY`. | Not Done |
| P0 | Deletion | The settings UI contains a delete flow, but the API has no delete endpoint. | Not Done |
| P1 | Git integration | There are no GitHub webhooks, push-triggered deployments, commit status updates, or automatic redeployments. | Not Done |
| P1 | Deployment history | Deployments are stored, but there is no clear concept of production deployment, rollback, promotion, or active version. | Not Done |
| P1 | Scaling | `scalingMode` is persisted but ignored. Kubernetes always creates one replica, regardless of the selected mode. | Not Done |
| P1 | Domains | URLs are hardcoded to `localtest.me` and a fixed NodePort. Custom domains, TLS, DNS, and production ingress are not implemented. | Not Done |
| P1 | Logs | Redis stores deployment events temporarily, but there is no durable, searchable, phase-aware log store. | Not Done |
| P2 | Operations | No queue dashboard, deployment cancellation, retry controls, stuck-job recovery, cleanup reconciliation, or resource usage history. | Not Done |
| P2 | Team/product layer | No organizations, projects, collaborators, roles, billing plans, usage limits, or API keys. | Not Done |

## Concrete implementation gaps

### 1. Settings API

The frontend calls:

```text
PATCH /api/deployments/:id/settings
```

but `apps/api/src/routes/deployments.routes.ts` contains no settings handler. The API currently exposes deployment creation, listing, details, redeploy, logs, and environment reads/updates.

Implement a validated settings endpoint that:

- Loads the deployment and associated agent.
- Updates build and runtime configuration.
- Replaces environment variables transactionally.
- Creates a new deployment revision instead of mutating the configuration used by historical deployments.
- Optionally triggers a redeploy.

### 2. Environment variable editing

The frontend proxy only has a `GET` handler for `/envs`, while the backend update path is:

```text
PATCH /:id/envs/update
```

The backend also treats the URL parameter as an `agentId`:

```ts
where: { id: Number(id) }
```

The URL parameter is a deployment ID, so this is not a reliable update path. Make environment variables part of the agent/project settings API and use the deployment relationship to locate the agent.

### 3. Dockerfile and build context support

The current flow accepts repository metadata and commands, but it does not fully model:

- Dockerfile path.
- Build context directory.
- Docker build target.
- Build arguments.
- Platform/architecture.
- Registry image tag.
- Cache configuration.
- Whether the image is built from a preset or a user-provided Dockerfile.

`createKanikoJob()` supports `pathOfDockerfile`, but the deployment flow never passes it. `rootDir` is saved but ignored when constructing the Kaniko context.

A better deployment configuration would include:

```text
source:
  provider: github
  repository
  branch
  commitSha
  rootDirectory
  dockerfilePath
  buildContext

image:
  registry
  repository
  tag
  cacheEnabled
```

For a Dockerfile-first platform, build from a pinned commit whenever a deployment is created rather than from a mutable branch.

### 4. Framework presets

The UI offers LangGraph, CrewAI, FastAPI, Vercel AI SDK, AutoGen, and custom Dockerfile presets. However, the backend ultimately receives strings such as `framework`, `buildCommand`, and `runCommand`; there is no framework-specific build or runtime behavior.

Presets should become versioned platform templates defining:

- Expected health endpoint.
- Default port.
- Default start command.
- Required runtime environment variables.
- Supported tracing integrations.
- Framework detection rules.
- Default resource profile.
- Example repository/template.
- Agent-specific deployment metadata.

For example, a LangGraph preset could automatically configure a `/healthz` check, OpenTelemetry instrumentation, a default streaming endpoint, and a recommended memory profile.

## Recommended deployment lifecycle

Use a more complete state machine:

```text
QUEUED
  → BUILDING
  → BUILD_FAILED

BUILDING
  → DEPLOYING
  → DEPLOY_FAILED

DEPLOYING
  → STARTING
  → READY
  → STARTUP_FAILED

READY
  → UPDATING
  → STOPPING
  → DEGRADED
  → FAILED
```

Each transition should record:

- Timestamp.
- Reason.
- Worker/job ID.
- Kubernetes resource name.
- Commit SHA.
- Image digest.
- Error details.
- Duration.

The deployment worker should wait for Kubernetes readiness instead of marking a deployment ready immediately after creating resources. Add:

- `readinessProbe`.
- `livenessProbe`.
- Startup timeout.
- Pod condition polling or watch.
- Container restart count.
- Last termination reason.
- Runtime health status.

## AI-agent-specific features

### 1. Native agent observability

Add first-class tracing for:

- LLM calls.
- Tool calls.
- Retrieval operations.
- Agent steps.
- Handoffs between agents.
- Streaming responses.
- Retries and fallbacks.
- Prompt and completion token counts.
- Latency per step.
- Errors and cancellations.

Use OpenTelemetry as the transport and define a Shikigami agent event schema. The platform should provide either:

```text
OpenTelemetry SDK
  → Shikigami collector
  → trace database
```

or integrations with existing providers such as Langfuse, Arize Phoenix, Helicone, or OpenLLMetry.

The dashboard should show a trace tree such as:

```text
Request
├── Agent run: customer-support
│   ├── OpenAI: gpt-5
│   ├── Tool: search_orders
│   ├── Retrieval: support_docs
│   └── Anthropic fallback
```

### 2. Cost tracking

Track costs at multiple levels:

- Per request.
- Per user/session.
- Per deployment.
- Per project.
- Per model/provider.
- Per tool invocation.
- Per workflow/agent run.

Record at least:

```text
provider
model
inputTokens
outputTokens
cachedTokens
reasoningTokens
requestCount
latencyMs
estimatedCost
timestamp
deploymentId
traceId
```

Do not calculate costs only from aggregate deployment metrics. Store immutable usage events and calculate rollups asynchronously.

Product-facing cost views should include:

- Cost per successful task.
- Cost per user.
- Cost by model.
- Cost by agent step.
- Daily/monthly spend.
- Estimated spend before deployment.
- Budget alerts.
- Model fallback cost comparison.

### 3. Model and provider configuration

Instead of requiring users to manually add provider keys to environment variables for every deployment, support provider connections:

- OpenAI.
- Anthropic.
- Google.
- Azure OpenAI.
- Bedrock.
- Mistral.
- Groq.
- Together.
- OpenRouter.

Allow an agent to declare:

```text
primary model
fallback model
embedding model
reranker
provider routing policy
maximum cost per request
maximum latency
```

The runtime can inject provider configuration without requiring provider-specific setup to be repeated for every deployment.

### 4. Agent runtime contract

Define a platform contract that any Dockerfile-based agent can implement:

```text
GET  /healthz
GET  /readyz
GET  /metadata
POST /runs
GET  /runs/:id
GET  /runs/:id/events
```

For streaming agents, support SSE or WebSockets. `/metadata` could return:

```json
{
  "name": "support-agent",
  "version": "1.3.0",
  "capabilities": ["streaming", "tool-calls", "tracing"],
  "models": ["gpt-5", "claude-sonnet"],
  "tools": ["search_orders", "create_ticket"]
}
```

This gives Shikigami a consistent way to monitor and present arbitrary agent containers.

### 5. Agent tests and evaluations

Add pre-deployment evaluations:

- Golden test cases.
- Regression tests.
- Tool-call correctness.
- Structured output validation.
- Hallucination checks.
- Latency thresholds.
- Cost thresholds.
- Human approval gates.

A deployment could show:

```text
Build passed
Runtime health passed
42/45 evaluation cases passed
Estimated cost: $0.018/task
p95 latency: 3.2s
```

Support promotion only when evaluation gates pass.

### 6. Prompt and configuration versions

Treat the following as deployable artifacts:

- System prompts.
- Tool definitions.
- Model routing.
- Retrieval configuration.
- Evaluation datasets.
- Agent configuration.
- Runtime environment.

Provide deployment diffs such as:

```text
Model: gpt-5 → claude-sonnet
System prompt: v12 → v13
Retrieval top-k: 5 → 8
Max tool retries: 2 → 3
```

## Differentiating Shikigami from Vercel

The current UI is Vercel-like: projects, deployments, branches, logs, settings, and redeployments. Keep that foundation, but make the primary object an **Agent**, not an application.

### Recommended dashboard sections

Add:

```text
Agents
Runs
Traces
Costs
Evaluations
Models
Tools
Deployments
```

An agent overview page should show:

- Current production version.
- Requests/runs over time.
- Success rate.
- p50/p95 latency.
- Cost per run.
- Token usage.
- Most-used models.
- Tool success/failure rates.
- Recent traces.
- Evaluation score.
- Active incidents.
- Current resource usage.

### Agent deployment wizard

The deployment flow could be:

1. Connect a GitHub repository.
2. Detect the agent framework.
3. Select a Dockerfile and build context.
4. Select model providers.
5. Configure tools and external services.
6. Configure tracing and cost tracking.
7. Define health and readiness endpoints.
8. Configure an evaluation suite.
9. Set resource, scaling, and budget limits.
10. Deploy to preview.
11. Run evaluations.
12. Promote to production.

This is more differentiated than simply asking for a Dockerfile and starting a Kubernetes Deployment.

## Recommended database model

The current `Agent`, `Deployment`, and `EnvVar` models are enough for the first container deployment, but not for a full AI platform. Add concepts similar to:

```text
Project
Agent
AgentVersion
Deployment
DeploymentRevision
Environment
EnvironmentVariable
ProviderConnection
ModelConfig
ToolDefinition
Trace
TraceSpan
LLMUsageEvent
CostAggregate
EvaluationSuite
EvaluationRun
Domain
Webhook
DeploymentEvent
```

Important distinctions:

- `Agent` represents the long-lived product.
- `AgentVersion` represents immutable source and configuration state.
- `Deployment` represents where a version is running.
- `LLMUsageEvent` represents individual provider calls.
- `Trace` and `TraceSpan` represent runtime execution.
- `DeploymentEvent` is durable rather than relying only on Redis.

## Suggested implementation phases

### Phase 1: Make deployment reliable

1. Implement settings and delete APIs.
2. Fix the environment variable update flow.
3. Add Dockerfile path and build-context support.
4. Persist image tags and image digests.
5. Wait for Kubernetes readiness.
6. Add runtime health checks.
7. Add deployment cancellation and retry.
8. Add durable deployment events and logs.
9. Add proper deployment history and rollback.
10. Replace hardcoded local URLs with configurable ingress/domain handling.

### Phase 2: Add agent runtime primitives

1. Define `/healthz`, `/readyz`, `/metadata`, and `/runs` conventions.
2. Add framework preset manifests.
3. Add provider and model configuration.
4. Add streaming run support.
5. Add OpenTelemetry trace ingestion.
6. Add a trace viewer.
7. Add token and latency collection.

### Phase 3: Add the differentiating platform layer

1. Cost tracking and budgets.
2. Evaluation suites and deployment gates.
3. Model routing and fallbacks.
4. Prompt and configuration versioning.
5. Tool registry.
6. Webhook-triggered preview deployments.
7. Production promotion and rollback.
8. Teams, projects, usage limits, and billing.

## Product direction

The key architectural decision is to separate **generic container deployment** from **agent runtime capabilities**.

Continue accepting arbitrary Dockerfiles, but make the following optional platform capabilities detectable and enrichable:

- Health and readiness contract.
- Run/streaming contract.
- Model usage events.
- OpenTelemetry traces.
- Tool metadata.
- Evaluation results.
- Cost attribution.

This preserves the flexibility of a Dockerfile-first deployment platform while allowing Shikigami to become an AI-agent platform when the deployed container supports the relevant capabilities.
