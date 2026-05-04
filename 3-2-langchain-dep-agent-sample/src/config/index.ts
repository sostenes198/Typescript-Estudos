import 'dotenv/config';
import path from 'path';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
const root = path.resolve(__dirname, '../..');

// Resolve caminho do script MCP conforme ambiente
function mcpScript(name: string) {
  return isDev
    ? path.join(root, `src/mcp-servers/${name}/server.ts`)
    : path.join(root, `dist/mcp-servers/${name}/server.js`);
}

export const config = {
  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
    model: 'claude-sonnet-4-6',
  },
  mongodb: {
    uri: required('MONGODB_URI'),
  },
  jira: {
    baseUrl: required('JIRA_BASE_URL'),
    email: required('JIRA_EMAIL'),
    apiToken: required('JIRA_API_TOKEN'),
  },
  slack: {
    botToken: required('SLACK_BOT_TOKEN'),
    notificationChannel: process.env.SLACK_NOTIFICATION_CHANNEL ?? '#pss-notifications',
  },
  services: {
    microAccount: required('MICRO_ACCOUNT_SERVICE_URL'),
    mobility: required('MOBILITY_SERVICE_URL'),
  },
  mcps: {
    // PAY e MOBILITY: stdio — cliente spawna o processo
    pay: {
      command: isDev ? 'ts-node' : 'node',
      script: mcpScript('pay-domain'),
    },
    mobility: {
      command: isDev ? 'ts-node' : 'node',
      script: mcpScript('mobility-domain'),
    },
    // RISK: HTTP Streamable — servidor externo
    risk: {
      url: required('RISK_MCP_URL'),
      token: required('RISK_MCP_TOKEN'),
    },
  },
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
} as const;
