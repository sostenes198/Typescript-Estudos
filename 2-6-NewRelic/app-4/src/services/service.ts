import newrelic from "newrelic";
import { DelayUtil } from "./utils/delay.util";
import { info } from "./utils/logger";
import Kafka from "../kafka";

export async function produceMessage(): Promise<{ name: string, status: string }> {
  info("Produzindo mensagem service app-4", { service: "app-4" });
  const result = await newrelic.startSegment("segment-customSpan:app-4:produceMessage:4", false, async () => {
    info("INICIALIZANDO span produceMessage service app-4", { spanService: "app-4" });
    newrelic.addCustomSpanAttribute("custom-span-attribute-inside-produceMessage-service-app-4", "4");
    newrelic.incrementMetric("metricApp4/produceMessage/app4/service");
    newrelic.addCustomAttribute("custom-attribute-inside-produceMessage-service-app-4", "4");

    await Kafka.produce();

    const result = {
      name: "PRODUCER - APP-4",
      status: "OK"
    };

    info("FINALIZANDO span produceMessage service app-4", { spanService: "app-4", resultSpan: result });

    return result;
  });

  info("FINALIZANDO produção mensagem app-4", { service: "app-4", result: result });
  return result;
}

export async function serviceExecute() {
  info("INICIALIZANDO service app-4", { service: "app-4" });
  const result = await newrelic.startSegment("segment-customSpan:app-4:service:4", false, async () => {
    info("INICIALIZANDO span service app-4", { spanService: "app-4" });
    newrelic.addCustomSpanAttribute("custom-span-attribute-inside-service-app-4", "4");
    newrelic.incrementMetric("metricApp4/app4/service");
    newrelic.addCustomAttribute("custom-attribute-inside-service-app-4", "4");
    await DelayUtil.Delay(1500);
    const result = {
      name: "APP-4",
      status: "OK"
    };

    info("FINALIZANDO span service app-4", { spanService: "app-4", resultSpan: result });
  });

  info("FINALIZANDO service app-4", { service: "app-4", result: result });
  return result;
}