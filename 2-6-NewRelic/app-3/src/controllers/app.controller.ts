import { Request, Response } from "express";
import newrelic from "newrelic";
import { serviceExecute } from "../services/service";
import { randomUUID } from "crypto";
import { child, info } from "../services/utils/logger";

// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async get(req: Request, res: Response) {
    child({ logsApp: "app-3", logTrace: randomUUID() });
    info("INICIALIZANDO GET CONTROLLER", { controller: "app-3" });

    newrelic.addCustomAttribute("custom-attribute-out-of-ct-app-3", "3");
    newrelic.addCustomSpanAttribute("custom-span-attribute-out-of-ct-app-3", "3");
    await newrelic.startSegment("customSpan:app-3", true, async () => {
      info("INICIALIZANDO span custom span-app-3", { span: "app-3" });
      newrelic.addCustomAttribute("custom-attribute-inside-of-ct-app-3", "3");
      newrelic.addCustomSpanAttribute("custom-span-attribute-inside-of-ct-app-3", "3");
      try {
        if (req.headers["failedservice3"])
          throw new Error("SIMULATE ERROR");

        const result = await serviceExecute();

        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({
          message: "Internal Server Error! APP 3",
          error: (err as Error).message
        });
      }

      info("FINALIZANDO span custom span-app-3", { span: "app-3" });
    });

    info("FINALIZANDO GET CONTROLLER", { controller: "app-3" });
  }
}
