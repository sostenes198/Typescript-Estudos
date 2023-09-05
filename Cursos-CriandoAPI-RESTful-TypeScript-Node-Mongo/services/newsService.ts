import NewsRepository from "../repository/newsRepository";

class NewsService {
    async get() {
        return NewsRepository.find({});
    }

    async getById(_id: any) {
        return NewsRepository.findById(_id.trim()/*, function (err: any, task: any) {
            if (err) {
                return null;
            }
            return task;
        }*/);
    }

    async create(news: any) {
        return NewsRepository.create(news);
    }

    async update(_id: any, news: any) {
        return NewsRepository.findByIdAndUpdate(_id, news);
    }

    async delete(_id: any) {
        return NewsRepository.findByIdAndRemove(_id);
    }
}

export default new NewsService();
