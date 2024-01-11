import newrelic from "newrelic";
import axios from "axios";
import { DelayUtil } from "./utils/delay.util";
import { info } from "./utils/logger";

export async function serviceExecute() {
  info("INICIALIZANDO service app-1", { service: "app-1" });
  const result = await newrelic.startSegment("segment-customSpan:app-1:service:1", false, async () => {
    info("INICIALIZANDO span service app-1", { spanService: "app-1" });
    newrelic.incrementMetric("metricApp1/app1/service");
    newrelic.addCustomAttribute("custom-attribute-inside-service-app-1", "1");
    newrelic.addCustomSpanAttribute("custom-span-attribute-inside-service-app-1", "1");
    await DelayUtil.Delay(500);
    const result = await axios.get("http://localhost:3011/api/app-2");

    info("FINALIZANDO span service app-1", { spanService: "app-1", resultSpan: result });
    return result.data;
  });
  info("FINALIZANDO service app-1", { service: "app-1", result: result });
  return result;
}