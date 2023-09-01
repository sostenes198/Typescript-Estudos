import NewsService from "../services/newsService";
import * as HttpStatus from "http-status";

import Helper from "../infra/helper";

class NewsController {
  get(req: any, res: any) {
    NewsService.get()
      .then(news => Helper.sendResponse(res, HttpStatus.OK, news))
      .catch(error => Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error));
  }

  getById(req: any, res: any) {
    const _id = req.params.id;

    console.log(`Awe ${_id}`);

    NewsService.getById(_id)
      .then(news => {
        Helper.sendResponse(res, HttpStatus.OK, news);
      })
      .catch(error => {
        Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error);
      });
  }

  create(req: any, res: any) {
    let vm = req.body;

    NewsService.create(vm)
      .then(news =>
        Helper.sendResponse(
          res,
          HttpStatus.OK,
          "Noticia cadastrada com sucesso!"
        )
      )
      .catch(error => Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error));
  }

  update(req: any, res: any) {
    const _id = req.params.id;
    let news = req.body;

    NewsService.update(_id, news)
      .then(news =>
        Helper.sendResponse(
          res,
          HttpStatus.OK,
          "Notícia foi atualiza com sucesso!"
        )
      )
      .catch(error => Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error));
  }

  delete(req: any, res: any) {
    const _id = req.params.id;

    NewsService.delete(_id)
      .then(() =>
        Helper.sendResponse(res, HttpStatus.OK, "Noticia deletada com sucesso!")
      )
      .catch(error => Helper.sendResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, error));
  }
}

export default new NewsController();
