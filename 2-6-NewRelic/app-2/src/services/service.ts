import newrelic from "newrelic";
import axios from "axios";
import { DelayUtil } from "./utils/delay.util";
import { Request } from "express";
import { info } from "./utils/logger";

export async function serviceExecute(req: Request) {
  info("INICIALIZANDO service app-2", { service: "app-2" });
  const result = await newrelic.startSegment("segment-customSpan:app-2:service:2", false, async () => {
    info("INICIALIZANDO span service app-2", { spanService: "app-2" });
    newrelic.addCustomSpanAttribute("custom-span-attribute-inside-service-app-2", "2");
    newrelic.incrementMetric("metricApp2/app2/service");
    newrelic.addCustomAttribute("custom-attribute-inside-service-app-2", "2");
    await DelayUtil.Delay(1000);
    const result = await axios.get("http://localhost:3012/api/app-3", {
      headers: {
        failedService3: req.headers["failedservice3"]
      }
    });

    info("FINALIZANDO span service app-2", { spanService: "app-2", resultSpan: result });
    return result.data;
  });

  info("FINALIZANDO service app-2", { service: "app-2", result: result });
  return result;
}