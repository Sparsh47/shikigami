# Shikigami

> **A Vercel-like deployment platform for AI agents** — connect a GitHub repo, configure your runtime, and ship to Kubernetes in one click.

Shikigami automates the full lifecycle of AI agent deployment: cloning source code, building a container image in-cluster with Kaniko, pushing to a registry, and launching the agent as a running Kubernetes workload — all from a polished web UI.

---

## Architecture

```
browser → Next.js frontend (port 3000)
               ↓  REST
         Fastify API (port 8080)
               ↓           ↓
          Prisma ORM    @kubernetes/client-node
               ↓                  ↓
          PostgreSQL       Kubernetes cluster
                          ┌───────────────────┐
                          │  Kaniko Job        │  (build)
                          │  Agent Deployment  │  (run)
                          └───────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS, TypeScript |
| Backend API | Fastify 5, Zod, TypeScript |
| ORM / DB | Prisma + PostgreSQL |
| Build pipeline | [Kaniko](https://github.com/GoogleContainerTools/kaniko) (in-cluster image builds) |
| Runtime orchestration | Kubernetes (`batch/v1 Job` → `apps/v1 Deployment`) |
| Monorepo tooling | Turborepo, npm workspaces |
| Auth | GitHub OAuth |

---

## Repository Layout

```
shikigami/
├── apps/
│   ├── api/           # Fastify backend — REST API + K8s orchestration
│   └── frontend/      # Next.js frontend — dashboard, deploy wizard
├── packages/
│   ├── db/            # Prisma schema + generated client (@repo/db)
│   └── k8s/           # Shared K8s manifest helpers
├── infra/             # Kubernetes YAML manifests (Kaniko job template, secrets)
├── turbo.json
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 24, **npm** ≥ 10
- **PostgreSQL** running locally (or a connection string in `.env`)
- A **Kubernetes cluster** accessible via `~/.kube/config`
  - [`cloud-provider-kind`](https://github.com/kubernetes-sigs/cloud-provider-kind) recommended for local dev
- A **DockerHub** account + a K8s secret named `dockerhub-secret` in the `default` namespace
- A **GitHub OAuth App** (Client ID + Secret) for authentication

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

**`apps/api/.env`**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/shikigami
```

**`apps/frontend/.env.local`**
```env
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
NEXTAUTH_SECRET=any_random_string
```

### 3. Push the Prisma schema

```bash
cd packages/db
npx prisma db push
```

### 4. Create the DockerHub K8s secret

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-username=YOUR_DOCKERHUB_USERNAME \
  --docker-password=YOUR_DOCKERHUB_PASSWORD \
  --docker-email=YOUR_EMAIL
```

### 5. Start everything

```bash
npm run dev
```

Turborepo starts both `apps/api` and `apps/frontend` concurrently.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8080 |

---

## Deployment Flow

1. **Connect** — authenticate with GitHub and browse your repositories.
2. **Configure** — select a framework preset (LangGraph, CrewAI, FastAPI, TypeScript AI SDK, AutoGen, or custom Dockerfile), set environment variables, compute resources, and branch.
3. **Deploy** — the frontend calls `POST /api/deployments`. The API:
   - Creates `Agent` + `Deployment` records in PostgreSQL
   - Submits a **Kaniko Job** to Kubernetes to build and push the container image
4. **Watch** — a background poller watches the Kaniko Job:
   - On **success** → updates `Deployment.status` to `READY`, launches the agent as a K8s `Deployment` with all env vars injected from Postgres
   - On **failure** → updates `Deployment.status` to `FAILED`
5. **Monitor** — the `/deployments/[id]` page shows live build logs and pipeline status.

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/deployments` | Create a new deployment |
| `GET` | `/api/deployments?userId=` | List all deployments for a user |
| `GET` | `/api/deployments/:id/logs` | SSE stream of build logs |

---

## Database Schema

```
Agent          — one per repo/user combo (build config, env vars, compute settings)
  └─ Deployment — one per deploy attempt (status, job name, url, timestamps)
       └─ EnvVar — key/value pairs injected into the agent pod at runtime
```

Status transitions: `QUEUED → BUILDING → READY | FAILED`

---

## Roadmap

- [ ] SSE log streaming from live Kaniko pod logs
- [ ] Automatic status polling on the deployment detail page
- [ ] Re-deploy on git push via GitHub webhooks
- [ ] Custom domain support via Ingress
- [ ] Multi-namespace isolation per user
- [ ] Metrics + resource usage dashboard

---

## Contributing

Pull requests are welcome. Run `npm run check-types` before submitting.

---

## License

MIT
