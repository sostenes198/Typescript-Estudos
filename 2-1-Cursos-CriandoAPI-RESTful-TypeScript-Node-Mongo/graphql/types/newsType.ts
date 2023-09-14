export default `
    scalar Date

    type Query{
        newsList:[News]
        newsGetById(id: String): News
    }   
    
    type News{
        _id: String,
        title: String,
        text: String,
        author: String,
        active: Boolean,
    }

    type Mutation{
        addNews(input: NewsInput): News
        updateNews(id: String, input: NewsInput): News
        deleteNews(id: String): News
    }

    input NewsInput{
        _id: String,
        title: String,
        text: String,
        author: String,
        active: Boolean,
    }    
`;