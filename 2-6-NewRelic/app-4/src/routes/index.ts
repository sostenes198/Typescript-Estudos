import { Application } from "express";
import homeRoutes from "./home.routes";
import appRoutes from "./app.routes";

export default class Routes {
  constructor(app: Application) {
    app.use("/api", homeRoutes);
    app.use("/api/app-4/produce", appRoutes);
  }
}
