import newrelic from "newrelic";
import { DelayUtil } from "./utils/delay.util";
import { info } from "./utils/logger";
import Kafka from "../kafka";

export async function serviceExecute() {
  info("INICIALIZANDO service app-3", { service: "app-3" });
  const result = await newrelic.startSegment("segment-customSpan:app-3:service:3", false, async () => {
    info("INICIALIZANDO span service app-3", { spanService: "app-3" });
    newrelic.addCustomSpanAttribute("custom-span-attribute-inside-service-app-3", "3");
    newrelic.incrementMetric("metricApp3/app3/service");
    newrelic.addCustomAttribute("custom-attribute-inside-service-app-3", "3");
    // await DelayUtil.Delay(1500);

    await Kafka.produce();

    const result = {
      name: "APP-3",
      status: "OK"
    };

    info("FINALIZANDO span service app-3", { spanService: "app-3", resultSpan: result });
    return result;
  });

  info("FINALIZANDO service app-3", { service: "app-3", result: result });
  return result;
}