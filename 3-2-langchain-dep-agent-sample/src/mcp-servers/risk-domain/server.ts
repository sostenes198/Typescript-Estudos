/**
 * Risk Domain MCP Server — transporte HTTP Streamable
 *
 * Servidor HTTP externo independente. O dep-agent conecta via HTTP Streamable.
 * Em produção: repositório separado @voll/dep-agent-risk-domain
 *
 * Expõe UMA tool: risk_process_card
 *
 * Para rodar:
 *   RISK_MCP_PORT=3001 DEP_AGENT_SECRET=... ts-node src/mcp-servers/risk-domain/server.ts
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { jiraCardDataSchema } from '../shared/card-schema';
import { runRiskOrchestrator } from './orchestrator';

// ─── MCP Server ───────────────────────────────────────────────────────────────

const mcpServer = new McpServer({
  name: 'risk-domain-mcp',
  version: '1.0.0',
});

mcpServer.tool(
  'risk_process_card',
  'Processa um card do board RISK. Roteia internamente por label (RiskAssessment, AccountFreeze). Retorna DomainResult em JSON.',
  { cardData: jiraCardDataSchema },
  async ({ cardData }) => {
    const result = await runRiskOrchestrator(cardData as any);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
);

// ─── Express + auth ───────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

const DEP_AGENT_SECRET = process.env.DEP_AGENT_SECRET ?? '';

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!DEP_AGENT_SECRET) return next(); // dev sem auth
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== DEP_AGENT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Endpoint MCP (HTTP Streamable — stateless) ───────────────────────────────
//
// Stateless: cria um novo transport por requisição.
// Para sessões persistentes (streaming longo), usar sessionIdGenerator.

app.post('/mcp', requireAuth, async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  res.on('close', () => transport.close());
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// GET /mcp — suporte a SSE para respostas em streaming
app.get('/mcp', requireAuth, async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on('close', () => transport.close());
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res);
});

// Health check
app.get('/health', (_, res) =>
  res.json({
    status: 'ok',
    name: 'risk-domain-mcp',
    version: '1.0.0',
    board: 'RISK',
    labels: ['RISK_ASSESSMENT', 'RISK_ACCOUNT_FREEZE'],
    transport: 'streamable_http',
    ts: new Date().toISOString(),
  })
);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.RISK_MCP_PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`[Risk MCP] Servidor HTTP Streamable na porta ${PORT}`);
  console.log(`[Risk MCP] Endpoint MCP: POST/GET /mcp`);
  console.log(`[Risk MCP] Auth: ${DEP_AGENT_SECRET ? 'habilitada' : 'desabilitada (dev)'}`);
});
