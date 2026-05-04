import express from 'express';
import { config } from './config';
import { connectMongo } from './core/db/mongo';
import { createMcpClient } from './core/mcp/client';
import { initializeDomainTools, initializeOrchestrator } from './orchestrator/orchestrator';
import { jiraWebhookRouter } from './webhooks/jira';
import { slackWebhookRouter } from './webhooks/slack';

async function bootstrap() {
  console.log('[Bootstrap] Iniciando dep-agent...');

  // 1. MongoDB
  await connectMongo();

  // 2. Conecta aos servidores MCP e carrega as tools de domínio
  //
  //    PAY + MOBILITY (stdio): o cliente spawna os processos filhos.
  //    RISK (HTTP Streamable): o cliente conecta ao servidor externo.
  //
  //    Se qualquer servidor estiver indisponível, o bootstrap falha —
  //    não subimos com domínios parcialmente conectados.
  const { client: mcpClient, tools } = await createMcpClient();

  // 3. Mapeia as tools MCP ao orquestrador (board → tool)
  initializeDomainTools(tools);

  // 4. Inicializa o grafo LangGraph com checkpointer MongoDB
  await initializeOrchestrator(config.mongodb.uri);

  // 5. Express
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_, res) =>
    res.json({
      status: 'ok',
      env: config.app.nodeEnv,
      ts: new Date().toISOString(),
      mcps: {
        pay:      { transport: 'stdio',            tool: 'pay_process_card' },
        mobility: { transport: 'stdio',            tool: 'mobility_process_card' },
        risk:     { transport: 'streamable_http',  tool: 'risk_process_card', url: config.mcps.risk.url },
      },
    })
  );

  app.use('/webhooks/jira', jiraWebhookRouter);
  app.use('/webhooks/slack', slackWebhookRouter);
  app.use((_, res) => res.status(404).json({ error: 'Not found' }));

  app.listen(config.app.port, () => {
    console.log(`[Server] Porta ${config.app.port} | Env: ${config.app.nodeEnv}`);
    console.log(`[Server] MCPs conectados:`);
    console.log(`         [stdio]           pay_process_card`);
    console.log(`         [stdio]           mobility_process_card`);
    console.log(`         [streamable_http] risk_process_card → ${config.mcps.risk.url}`);
  });

  // Graceful shutdown — fecha conexões MCP ao encerrar
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} recebido — encerrando...`);
    await mcpClient.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Erro fatal:', err);
  process.exit(1);
});
