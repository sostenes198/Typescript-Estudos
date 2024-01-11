import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import newrelic from "newrelic";
import { serviceExecute } from "../services/service";
import { child, info } from "../services/utils/logger";
import { randomUUID } from "crypto";


// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async get(req: Request, res: Response) {
    child({ logsApp: "app-1", logTrace: randomUUID() });
    info("INICIALIZANDO GET CONTROLLER", { controller: "app-1" });
    newrelic.addCustomAttribute("custom-attribute-out-of-ct-app-1", "1");
    newrelic.addCustomSpanAttribute("custom-span-attribute-out-of-ct-app-1", "1");
    await newrelic.startSegment("customSpan:app-1", true, async () => {
      info("INICIALIZANDO span custom span-app-1", { span: "app-1" });
      try {
        newrelic.addCustomAttribute("custom-attribute-inside-of-ct-app-1", "1");
        newrelic.addCustomSpanAttribute("custom-span-attribute-inside-of-ct-app-1", "1");
        const service2Result = await serviceExecute();

        res.status(200).json({
          service1: {
            name: "APP-1",
            status: "OK",
            service2: service2Result
          }
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

        info("FINALIZANDO span custom span-app-1", { span: "app-1" });
      }
    });

    info("FINALIZANDO GET CONTROLLER", { controller: "app-1" });
  }

  async get_with_error(req: Request, res: Response) {
    await newrelic.startSegment("customSpan:app-1/error/app-1", true, async () => {
      try {
        throw new Error("SIMULATE ERROR");
      } catch (err) {
        res.status(500).json({
          message: "Internal Server Error! APP 1",
          error: (err as Error).message
        });
      }
    });

  }

  async get_with_error_app_2(req: Request, res: Response) {
    await newrelic.startSegment("customSpan:app-1/error/app-2", true, async () => {
      try {
        await axios.get("http://localhost:3011/api/app-2", {
          headers: {
            failedService2: "true"
          }
        });

        throw new Error("MUST HAPPEN ERROR ON APP 2");
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
    });
  }

  async get_with_error_app_3(req: Request, res: Response) {
    await newrelic.startSegment("customSpan:app-1/error/app-3", true, async () => {
      try {
        await axios.get("http://localhost:3011/api/app-2", {
          headers: {
            failedService3: "true"
          }
        });

        throw new Error("MUST HAPPEN ERROR ON APP 3");
      } catch (err) {
        let message = null;
        if (err instanceof Error)
          message = err.message;

        if (err instanceof AxiosError)
          message = err.response!.data;


        res.status(500).json({
          message: "Internal Server Error! APP 1",
          error: message
        });
      }
    });
  }
}
