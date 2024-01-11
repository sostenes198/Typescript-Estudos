import { Request, Response } from "express";
import newrelic from "newrelic";

// noinspection ExceptionCaughtLocallyJS
export default class AppController {
  async get(req: Request, res: Response) {
    await newrelic.startSegment("customSpan:app-3", true, async () => {
      try {
        if (req.headers["failedservice3"])
          throw new Error("SIMULATE ERROR");

        res.status(200).json({
          name: "APP-3",
          status: "OK"
        });
      } catch (err) {
        res.status(500).json({
          message: "Internal Server Error! APP 3",
          error: (err as Error).message
        });
      }
    });
  }
}
