import { Router } from "express";
import AppController from "../controllers/app.controller";

class AppRoutes {
  router = Router();
  controller = new AppController();

  constructor() {
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get("/", this.controller.get);
    this.router.get("/error/app-1", this.controller.get_with_error);
    this.router.get("/error/app-2", this.controller.get_with_error_app_2);
    this.router.get("/error/app-3", this.controller.get_with_error_app_3);
  }
}

export default new AppRoutes().router;
