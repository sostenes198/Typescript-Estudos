import NewsService from "../services/newsService";
import * as HttpStatus from 'http-status';
import Helper from "../infra/helper";

class NewsController {

    get(req: any, res: any) {
        NewsService.get()
            .then(news => Helper.sendResponse(res, HttpStatus.OK, news))
            .catch(error => console.error.bind(console, `Error ${error}`));
    }

    getById(req: any, res: any) {
        const id = req.params.id;
        NewsService.getById(id)
            .then(news => Helper.sendResponse(res, HttpStatus.OK, news))
            .catch(error => console.error.bind(console, `Error ${error}`));
    }

    create(req: any, res: any) {
        let vm = req.body;
        NewsService.create(vm)
            .then(news => Helper.sendResponse(res, HttpStatus.OK, "Notícia cadastrada"))
            .catch(error => console.error.bind(console, `Error ${error}`));
    }

    update(req: any, res: any) {
        const id = req.params.id;
        let vm = req.body;
        NewsService.update(id, vm)
            .then(news => Helper.sendResponse(res, HttpStatus.OK, "Notícia atualizada com sucesso"))
            .catch(error => console.error.bind(console, `Error ${error}`));
    }

    delete(req: any, res: any) {
        const id = req.params.id;
        NewsService.delete(id)
            .then(news => Helper.sendResponse(res, HttpStatus.OK, "Notícia deletada com sucesso"))
            .catch(error => console.error.bind(console, `Error ${error}`));
    }
}

export default new NewsController();