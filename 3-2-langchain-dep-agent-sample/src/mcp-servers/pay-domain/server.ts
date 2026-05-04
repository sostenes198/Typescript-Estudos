/**
 * PAY Domain MCP Server — transporte stdio
 *
 * Processo filho spawnaado pelo dep-agent via MultiServerMCPClient.
 * Comunica pelo protocolo MCP real (JSON-RPC 2.0) sobre stdin/stdout.
 *
 * Expõe UMA tool: pay_process_card
 *   → recebe JiraCardData
 *   → roteia internamente por label para os agentes especialistas
 *   → retorna DomainResult serializado
 *
 * Em produção (repo separado @voll/dep-agent-pay-domain):
 *   O cliente configura:
 *     command: 'node'
 *     args: ['node_modules/@voll/dep-agent-pay-domain/dist/server.js']
 */

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { jiraCardDataSchema } from '../shared/card-schema';
import { runPayOrchestrator } from './orchestrator';

const server = new McpServer({
  name: 'pay-domain-mcp',
  version: '1.0.0',
});

server.tool(
  'pay_process_card',
  'Processa um card do board PAY. Roteia internamente por label para os agentes especialistas (FraudDetectionRule, CardCancel). Retorna DomainResult em JSON.',
  { cardData: jiraCardDataSchema },
  async ({ cardData }) => {
    const result = await runPayOrchestrator(cardData as any);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
);

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio — logs vão para stderr para não poluir o protocolo MCP no stdout
  process.stderr.write('[PAY MCP] Servidor stdio pronto\n');
})().catch((err) => {
  process.stderr.write(`[PAY MCP] Erro fatal: ${err.message}\n`);
  process.exit(1);
});
