import { Filter, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import { InsertResultMany } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/InsertResultMany';
import { InsertResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/InsertResult';
import { UpdateResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/UpdateResult';
import { DeleteResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/DeleteResult';

export interface MongoService {
    ListAsync<T extends object = object>(collectionName: string, filter: Filter<T>): Promise<T[]>;
    GetAsync<T extends object = object>(collectionName: string, filter: Filter<T>): Promise<T>;
    InsertManyAsync<T extends object = object>(collectionName: string, documents: OptionalUnlessRequiredId<T>[]): Promise<InsertResultMany>;
    InsertAsync<T extends object = object>(collectionName: string, document: OptionalUnlessRequiredId<T>): Promise<InsertResult>;
    UpdateAsync<T extends object = object>(collectionName: string, filter: Filter<T>, update: UpdateFilter<T> | Partial<T>): Promise<UpdateResult>;
    DeleteAsync<T extends Object>(collectionName: string, filter: Filter<T>): Promise<DeleteResult>;
}
