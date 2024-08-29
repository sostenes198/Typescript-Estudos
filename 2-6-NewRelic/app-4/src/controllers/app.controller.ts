import { Request, Response } from "express";
import newrelic from "newrelic";
import { produceMessage } from "../services/service";
import { randomUUID } from "crypto";
import { child, info } from "../services/utils/logger";

// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async producer(req: Request, res: Response) {
    child({ logsApp: "app-4", logTrace: randomUUID() });
    info("INICIALIZANDO PRODUCER CONTROLLER", { controller: "app-4" });

    newrelic.addCustomAttribute("custom-attribute-out-of-ct-app-4", "4");
    newrelic.addCustomSpanAttribute("custom-span-attribute-out-of-ct-app-4", "4");
    await newrelic.startSegment("customSpan:app-4", true, async () => {
      info("INICIALIZANDO span custom span-app-4", { span: "app-4" });
      newrelic.addCustomAttribute("custom-attribute-inside-of-ct-app-4", "4");
      newrelic.addCustomSpanAttribute("custom-span-attribute-inside-of-ct-app-4", "4");
      try {
        if (req.headers["failedservice4"])
          throw new Error("SIMULATE ERROR");

        const result = await produceMessage();

        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({
          message: "Internal Server Error! APP 4",
          error: (err as Error).message
        });
      }

      info("FINALIZANDO span custom span-app-4", { span: "app-4" });
    });

    info("FINALIZANDO PRODUCER CONTROLLER", { controller: "app-4" });
  }
}
