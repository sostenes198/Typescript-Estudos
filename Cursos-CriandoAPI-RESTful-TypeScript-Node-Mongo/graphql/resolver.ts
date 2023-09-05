import newsService from "../services/newsService";
import NewsService from "../services/newsService";

const resolvers = {
    newsList: async () => {
        return await NewsService.get();
    },
    newsGetById: async (args: any) => {
        return await NewsService.getById(args.id);
    },
    addNews: async (args: any) => {
        return await newsService.create(args.input);
    },
    updateNews: async (args: any) => {
        return await newsService.update(args.input._id, args.input);
    },
    deleteNews: async (args: any) => {
        return await NewsService.delete(args.id);
    }
};

export default resolvers;