# Mergn Claude Agents

## Available Agents

| Agent | File | Workstream | MCP Servers |
|-------|------|-----------|-------------|
| **Backend Engineer** | `backend-engineer.md` | Backend squad | PostgreSQL (dev), GitHub, Atlassian |
| **Frontend Engineer** | `frontend-engineer.md` | Frontend squad | GitHub, Atlassian |
| **Shopify Expert** | `shopify-expert.md` | All squads (Shopify) | PostgreSQL (dev), GitHub, Atlassian |
| **UI/UX Designer** | `ui-ux-designer.md` | Design squad | GitHub, Atlassian |
| **DevOps/Infra** | `devops-infra.md` | DevOps squad | AWS, GitHub, Atlassian, Teams |
| **QA Engineer** | `qa-engineer.md` | QA squad | GitHub, Atlassian |
| **Product/PM** | `product-pm.md` | PM squad | Atlassian, Teams |
| **Data & Analytics** | `data-analytics.md` | Data squad | PostgreSQL (prod read-only, staging), GitHub |

## How to Use

Start Claude Code with a specific agent:
```bash
claude --agent mergn-backend-engineer
claude --agent mergn-frontend-engineer
claude --agent mergn-shopify-expert
claude --agent mergn-ui-ux-designer
claude --agent mergn-devops-infra
claude --agent mergn-qa-engineer
claude --agent mergn-product-pm
claude --agent mergn-data-analytics
```

Or reference agents in conversation:
- Ask backend questions → Claude delegates to backend agent
- Ask about UI design → Claude delegates to UI/UX agent

## Trigger Phrases

Each agent responds to specific trigger phrases — see the agent file for details.

## MCP Server Setup

Before using agents, configure the MCP servers in `.claude/.mcp.json`.
Each team member needs environment variables set for their relevant servers.
See `.env.claude.example` for the full list.
