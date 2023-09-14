import { buildSchema } from 'graphql';
import newsType from './types/newsType';

const schema = buildSchema(
    newsType
);

export default schema;