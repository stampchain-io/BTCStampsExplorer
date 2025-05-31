# 📦 BTCStampsExplorer Dev Container

This README describes the GitHub Codespaces/Factory **devcontainer** that ships with the `BTCStampsExplorer` repository ( **dev** branch ).  
It is intended for any contributor who wants a _ready-to-code_ workspace without installing Deno, MySQL or Redis locally.

---

## 1. What the Dev Container Provides
| Feature | Details |
|---------|---------|
| **Runtime** | Deno 2.3.3 (matches `utils/check_deno_version.ts`) |
| **Editor** | VS Code / Factory with rich extensions (Deno, Tailwind, ESLint, Copilot, Docker…) |
| **Services** | • `app` – Fresh SSR server<br>• `mysql` – MariaDB 10.6 with UTF8-MB4<br>• `redis` – Redis 7 (AOF, password protected) |
| **Hot-reload & Debug** | `deno task dev` runs with `--watch` and inspector on **9229** |
| **Persisted caches** | Named Docker volumes for Deno cache, NPM cache, node_modules, MySQL & Redis data |
| **Ports forwarded** | 8000 (Fresh app), 3306 (MySQL), 6379 (Redis), 9229 (Deno inspector) |

---

## 2. Prerequisites & First-time Setup
1. **Factory / VS Code** with Dev Containers extension (or use GitHub Codespaces).  
2. **Docker Desktop** running & configured for Linux containers.
3. Open the repository in Factory → **“Reopen in Container”**.  
   The tooling will:
   - build the image defined in `.devcontainer/Dockerfile`,
   - start the Compose stack from `.devcontainer/docker-compose.yml`,
   - clone the **dev** branch,
   - copy `.env.sample` → `.env` if none exists,
   - pre-cache TypeScript dependencies.

> ⚠️ First build can take several minutes while dependencies & database images download.

---

## 3. Using the Development Environment

Inside the Dev Container terminal (`deno` user, path `/app`):

```bash
# Start the Fresh dev server with hot-reload + debugger
deno task dev
# Access the explorer at http://localhost:8000
```

Inspector is available at `chrome://inspect` → **9229**.

**Database & Redis shells**

```bash
# MySQL (password: btcstamps_dev)
mysql -h mysql -ubtcstamps -pbtcstamps_dev btc_stamps

# Redis (password: redis_dev_password)
redis-cli -h redis -a redis_dev_password
```

---

## 4. Available Services & Ports
| Service | Host Port | Container | Purpose |
|---------|-----------|-----------|---------|
| Fresh App | **8000** | app | SSR / API |
| Deno Inspector | **9229** | app | Debugging |
| MySQL | **3306** | mysql | Stamp index DB |
| Redis | **6379** | redis | Cache layer |

All ports are auto-forwarded by Factory; 8000 triggers a notification.

---

## 5. Common Development Tasks & Commands
| Task | Command |
|------|---------|
| Lint, format, type-check | `deno task check` |
| Run unit tests | `deno task test:src20` |
| Build production bundle | `deno task build` |
| Update Fresh | `deno task update` |
| Decode SRC-20 tx | `deno task decode` |
| Reset Compose stack | `docker compose down -v` |
| Seed database | place SQL in `.devcontainer/mysql-init/*.sql` |

---

## 6. Troubleshooting Tips
| Symptom | Fix |
|---------|-----|
| **Port already in use** | Stop local services or change `forwardPorts` in `devcontainer.json`. |
| `Your Deno version is …` | Rebuild container to pull correct Deno tag. |
| DB connection errors | Ensure `mysql` service is **healthy** (`docker compose ps`). |
| Redis auth error | Check `ELASTICACHE_ENDPOINT` & password in `.env`. |
| File change not triggering reload | Verify file is inside the mounted workspace, not excluded in `deno.json` watch-exclude. |
| Stale caches | `docker volume rm btcstampsexplorer_deno-cache` etc. |

---

## 7. Environment Variables
A `.env` file is copied from `.env.sample` on first start.  
Populate the values as needed; Dev Container overrides some defaults via `docker-compose.yml`.

Important vars:

```
DB_HOST=mysql
DB_USER=btcstamps
DB_PASSWORD=btcstamps_dev
DB_NAME=btc_stamps
QUICKNODE_ENDPOINT=https://example.quicknode.com
QUICKNODE_API_KEY=changeme
CACHE=true
ELASTICACHE_ENDPOINT=redis
CSRF_SECRET_KEY=dev_secret_key_change_in_production
```

---

## 8. Database Setup & Initialization

The `mysql` container automatically creates:

- database `btc_stamps`
- user `btcstamps` / `btcstamps_dev` with full rights

Place SQL seed files in `.devcontainer/mysql-init/*.sql`; they run once on first boot.

---

## 9. Redis Cache Configuration

Redis runs with persistence (`--appendonly yes`) and password `redis_dev_password`.  
The app connects using `ELASTICACHE_ENDPOINT=redis` and port `6379`.  
In development mode (`SKIP_REDIS_CONNECTION=true`) the server falls back to in-memory cache.

---

## 10. Recommended Development Workflow

1. **Start container** → auto-attaches to VS Code.
2. Modify code; Fresh hot-reloads instantly.
3. Run `deno task check` locally before committing.
4. Write/adjust tests in `tests/` and run with watch mode:
   ```bash
   deno task test:src20:watch
   ```
5. When satisfied, commit on **dev** branch and push; CI will run the same tasks.

Happy hacking on **BTCStampsExplorer**! 🎉
