import NewsRepository from "../repository/newsRepository";

class NewsService {
    get() {
        return NewsRepository.find({});
    }

    getById(_id: any) {
        return NewsRepository.findById(_id.trim()/*, function (err: any, task: any) {
            if (err) {
                return null;
            }
            return task;
        }*/);
    }

    create(news: any) {
        return NewsRepository.create(news);
    }

    update(_id: any, news: any) {
        return NewsRepository.findByIdAndUpdate(_id, news);
    }

    delete(_id: any) {
        return NewsRepository.findByIdAndRemove(_id);
    }
}

export default new NewsService();
