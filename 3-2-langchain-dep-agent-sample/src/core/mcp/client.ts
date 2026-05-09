import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { config } from '../../config';

/**
 * Cria e conecta o cliente MCP aos três servidores de domínio.
 *
 * PAY e MOBILITY — stdio:
 *   O cliente spawna os processos como filhos, comunicando via stdin/stdout.
 *   Protocolo MCP real (JSON-RPC 2.0) sobre stdio.
 *
 * RISK — HTTP (Streamable HTTP):
 *   O cliente conecta ao servidor HTTP externo.
 *   Protocolo MCP sobre HTTP Streamable (transport: 'http' na v1 dos adapters).
 *
 * Cada servidor expõe UMA tool (facade):
 *   pay_process_card      → PAY
 *   mobility_process_card → MOBILITY
 *   risk_process_card     → RISK
 *
 * O orquestrador principal roteia de forma determinística:
 *   board → tool name → tool.invoke({ cardData })
 */
export async function createMcpClient(): Promise<{
  client: MultiServerMCPClient;
  tools: StructuredToolInterface[];
}> {
  // Env vars herdadas pelos processos filhos (stdio MCPs precisam de acesso)
  const childEnv: Record<string, string> = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
  );

  const client = new MultiServerMCPClient({
    // ── PAY — stdio ────────────────────────────────────────────────────────
    'pay-domain': {
      transport: 'stdio',
      command: config.mcps.pay.command,
      args: [config.mcps.pay.script],
      env: childEnv,
    },

    // ── MOBILITY — stdio ───────────────────────────────────────────────────
    'mobility-domain': {
      transport: 'stdio',
      command: config.mcps.mobility.command,
      args: [config.mcps.mobility.script],
      env: childEnv,
    },

    // ── RISK — HTTP Streamable ─────────────────────────────────────────────
    'risk-domain': {
      transport: 'http',
      url: config.mcps.risk.url,
      headers: {
        Authorization: `Bearer ${config.mcps.risk.token}`,
      },
    },
  });

  // Conecta e carrega as tools de todos os servidores
  // Resultado esperado: [pay_process_card, mobility_process_card, risk_process_card]
  const tools = await client.getTools();

  console.log(
    '[MCP Client] Tools carregadas:',
    tools.map((t) => t.name).join(', ')
  );

  return { client, tools };
}
