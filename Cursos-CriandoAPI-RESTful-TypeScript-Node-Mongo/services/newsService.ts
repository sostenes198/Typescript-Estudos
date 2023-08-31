import newsRepository from "../repository/newsRepository";
import NewsRepository from "../repository/newsRepository";

class NewsService {

    public get() {
        return NewsRepository.find({});
        const x: number = 10;
    }

    public getById(id: any) {
        return NewsRepository.find({ id });
    }

    public create(news: any) {
        return NewsRepository.create(news);
    }

    public update(id: any, news: any) {
        return NewsRepository.findByIdAndUpdate(id, news);
    }

    public delete(id: any) {
        return NewsRepository.findByIdAndRemove(id);
    }
}

export default new NewsService();