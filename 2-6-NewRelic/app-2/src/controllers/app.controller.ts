import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import newrelic from "newrelic";

// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async get(req: Request, res: Response) {
    await newrelic.startSegment("customSpan:app-2", true, async () => {
      try {
        if (req.headers["failedservice2"])
          throw new Error("SIMULATE ERROR");

        const result = await axios.get("http://localhost:3012/api/app-3", {
          headers: {
            failedService3: req.headers["failedservice3"]
          }
        });

        res.status(200).json({
          name: "APP-2",
          status: "OK",
          service3: result.data
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
    });
  }
}
