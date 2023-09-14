import NewsService from "../services/newsService";
import * as HttpStatus from "http-status";
import { createClient } from 'redis';

import Helper from "../infra/helper";
import ExportFiles from "../infra/exportFiles";
import helper from "../infra/helper";

class NewsController {
  async get(req: any, res: any) {
    try {
      let redisClient = createClient({
        password: "Password",
        socket: {
          port: 6379,
          host: process.env.RUN_IN_DOCKER ? 'redis' : 'localhost'
        }
      });

      await redisClient.connect();

      let redisResult = await redisClient.get('news');

      if (redisResult) {
        Helper.sendResponse(res, HttpStatus.OK, JSON.parse(redisResult));
        return;
      }

      let result = await NewsService.get();
      await redisClient.set('news', JSON.stringify(result));
      await redisClient.expire('news', 60);
      Helper.sendResponse(res, HttpStatus.OK, result);
    }
    catch (error: any) {
      Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async getById(req: any, res: any) {
    try {
      const _id = req.params.id;

      console.log(`Awe ${_id}`);

      let result = await NewsService.getById(_id);
      Helper.sendResponse(res, HttpStatus.OK, result);

    }
    catch (error) {
      Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error);
    }

  }

  async exportToCsv(req: any, res: any) {
    try {
      let response = await NewsService.get();
      let filename = await ExportFiles.tocsv(response);
      helper.sendResponse(res, HttpStatus.OK, req.get('host') + "/exports/" + filename);
    }
    catch (error) {

    }
  }

  async create(req: any, res: any) {
    try {
      let vm = req.body;

      let result = await NewsService.create(vm);
      Helper.sendResponse(
        result,
        HttpStatus.OK,
        "Noticia cadastrada com sucesso!"
      );
    }
    catch (error) {
      Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async update(req: any, res: any) {
    try {
      const _id = req.params.id;
      let news = req.body;

      let result = await NewsService.update(_id, news);
      Helper.sendResponse(
        result,
        HttpStatus.OK,
        "Notícia foi atualiza com sucesso!"
      );

    }
    catch (error) {
      Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async delete(req: any, res: any) {
    try {
      const _id = req.params.id;

      let result = await NewsService.delete(_id);
      Helper.sendResponse(result, HttpStatus.OK, "Noticia deletada com sucesso!");
    }
    catch (error) {
      Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }
}

export default new NewsController();
