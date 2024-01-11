import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import newrelic from "newrelic";
import { serviceExecute } from "../services/service";
import { randomUUID } from "crypto";
import { child, info } from "../services/utils/logger";

// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async get(req: Request, res: Response) {
    child({ logsApp: "app-2", logTrace: randomUUID() });
    info("INICIALIZANDO GET CONTROLLER", { controller: "app-2" });

    newrelic.addCustomAttribute("custom-attribute-out-of-ct-app-2", "2");
    newrelic.addCustomSpanAttribute("custom-span-attribute-out-of-ct-app-2", "2");
    await newrelic.startSegment("customSpan:app-2", true, async () => {
      info("INICIALIZANDO span custom span-app-2", { span: "app-2" });
      newrelic.addCustomAttribute("custom-attribute-inside-of-ct-app-2", "2");
      newrelic.addCustomSpanAttribute("custom-span-attribute-inside-of-ct-app-2", "2");
      try {
        if (req.headers["failedservice2"])
          throw new Error("SIMULATE ERROR");

        const service3Result = await serviceExecute(req);

        res.status(200).json({
          name: "APP-2",
          status: "OK",
          service3: service3Result
        });
      } catch (err) {
        let message = null;
        if (err instanceof Error)
          message = err.message;

        if (err instanceof AxiosError)
          message = err.response!.data;


        res.status(500).json({
          message: "Internal Server Error! APP 2",
          error: message
        });
      }

      info("FINALIZANDO span custom span-app-2", { span: "app-2" });
    });

    info("FINALIZANDO GET CONTROLLER", { controller: "app-2" });
  }
}
