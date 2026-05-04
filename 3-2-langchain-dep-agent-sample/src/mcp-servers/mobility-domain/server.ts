/**
 * Mobility Domain MCP Server — transporte stdio
 *
 * Expõe UMA tool: mobility_process_card
 * Em produção: @voll/dep-agent-mobility-domain
 */

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { jiraCardDataSchema } from '../shared/card-schema';
import { runMobilityOrchestrator } from './orchestrator';

const server = new McpServer({
  name: 'mobility-domain-mcp',
  version: '1.0.0',
});

server.tool(
  'mobility_process_card',
  'Processa um card do board MOBILITY. Roteia internamente por label (AttachmentFix). Retorna DomainResult em JSON.',
  { cardData: jiraCardDataSchema },
  async ({ cardData }) => {
    const result = await runMobilityOrchestrator(cardData as any);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
);

(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[MOBILITY MCP] Servidor stdio pronto\n');
})().catch((err) => {
  process.stderr.write(`[MOBILITY MCP] Erro fatal: ${err.message}\n`);
  process.exit(1);
});
