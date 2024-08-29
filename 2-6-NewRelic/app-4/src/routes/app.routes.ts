import { Router } from "express";
import AppController from "../controllers/app.controller";

class AppRoutes {
  router = Router();
  controller = new AppController();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get("/", this.controller.producer);
  }
}

export default new AppRoutes().router;
