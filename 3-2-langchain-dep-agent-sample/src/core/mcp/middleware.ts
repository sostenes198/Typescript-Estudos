import { createMiddleware } from 'langchain';
import type { StructuredToolInterface } from '@langchain/core/tools';

/**
 * Middleware de injeção dinâmica de tools para agentes especialistas.
 *
 * Problema que resolve:
 *   Sem isolamento, se o agente PayFraudDetectionRule receber tools de outros
 *   MCPs no contexto (cancel_cards, fix_attachment...), o LLM pode aluciná-las —
 *   chamar uma tool que não é a correta para aquela operação.
 *
 * Solução:
 *   Cada MCP cria seu próprio middleware passando APENAS as tools que ele
 *   declara. O agente especialista é criado com tools: [] e o middleware
 *   injeta apenas as tools corretas em runtime via wrapModelCall + wrapToolCall.
 *
 * Documentação de referência:
 *   https://docs.langchain.com/oss/javascript/langchain/agents#dynamic-tools
 *   (seção "Runtime tool registration")
 *
 * Uso dentro de um domain MCP:
 *
 *   const domainToolsMiddleware = createDomainToolsMiddleware([
 *     updateFraudLimitTool,
 *     resetFraudLimitTool,
 *   ]);
 *
 *   const fraudAgent = createAgent({
 *     model,
 *     tools: [],   // vazio — tools serão injetadas pelo middleware
 *     middleware: [domainToolsMiddleware],
 *   });
 */
export function createDomainToolsMiddleware(tools: StructuredToolInterface[]) {
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  return createMiddleware({
    name: 'DomainToolsMiddleware',

    /**
     * wrapModelCall: chamado antes de enviar o prompt ao LLM.
     * Injeta as tools do MCP no request — o LLM só enxerga essas tools,
     * não importa quais foram passadas na criação do agente.
     */
    wrapModelCall: (request, handler) => {
      return handler({
        ...request,
        tools: tools, // substitui completamente — sem ferramentas de outros MCPs
      });
    },

    /**
     * wrapToolCall: chamado quando o LLM decide invocar uma tool.
     * Roteia para a implementação correta do MCP.
     * Se a tool não pertence a este MCP, deixa o handler padrão resolver
     * (isso nunca deve acontecer com o wrapModelCall correto, mas é uma
     * salvaguarda extra).
     */
    wrapToolCall: (request, handler) => {
      const tool = toolMap.get(request.toolCall.name);
      if (tool) {
        return handler({ ...request, tool });
      }
      return handler(request);
    },
  });
}
