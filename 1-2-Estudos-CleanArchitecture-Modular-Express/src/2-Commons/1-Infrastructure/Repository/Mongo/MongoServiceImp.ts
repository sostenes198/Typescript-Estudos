// TODO AVALIAR SE DA PRA TESTAR
import {
    Collection,
    Db,
    DeleteResult as DeleteResultMongoDriver,
    Document,
    Filter,
    InsertManyResult,
    InsertOneResult,
    MongoClient,
    OptionalUnlessRequiredId,
    UpdateFilter,
    UpdateResult as UpdateResultMongoDriver,
} from 'mongodb';
import { InsertResultMany } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/InsertResultMany';
import { InsertResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/InsertResult';
import { UpdateResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/UpdateResult';
import { DeleteResult } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Types/DeleteResult';
import { MongoService } from '@/2-Commons/1-Infrastructure/Repository/Mongo/Interfaces/MongoService';

export class MongoServiceImp implements Disposable, MongoService {
    private readonly _mongoClient: MongoClient;
    private readonly _db: Db;
    private readonly _collections: Record<string, Collection<any>> = {};

    public constructor(mongoClient: MongoClient, databaseName: string) {
        this._mongoClient = mongoClient;
        this._mongoClient
            .connect()
            .then()
            .catch((reason) => {
                throw new Error(reason);
            });
        this._db = this._mongoClient.db(databaseName);
    }

    public async ListAsync<T extends object = object>(collectionName: string, filter: Filter<T>): Promise<T[]> {
        const collection = this.GetCollection<T>(collectionName);
        const findResult = await collection.find(filter).toArray();
        return findResult.map((findResultItem) => {
            const { _id, ...item } = findResultItem;
            return item as T;
        });
    }

    public async GetAsync<T extends object = object>(collectionName: string, filter: Filter<T>): Promise<T> {
        const collection = this.GetCollection<T>(collectionName);
        const findResult = await collection.findOne(filter);
        if (!findResult) return null!;
        const { _id, ...item } = findResult;
        return item as T;
    }

    public async InsertManyAsync<T extends object = object>(
        collectionName: string,
        documents: OptionalUnlessRequiredId<T>[],
    ): Promise<InsertResultMany> {
        const collection = this.GetCollection<T>(collectionName);
        const result: InsertManyResult<T> = await collection.insertMany(documents);
        if (result.acknowledged) {
            const ids: number[] = Object.keys(result.insertedIds)
                .map((item: string) => result.insertedIds[Number(item)].id)
                .map((item) => Number(item));
            InsertResultMany.Success(result.insertedCount, ids);
        }

        return InsertResultMany.Fail();
    }

    public async InsertAsync<T extends object = object>(collectionName: string, document: OptionalUnlessRequiredId<T>): Promise<InsertResult> {
        const collection = this.GetCollection<T>(collectionName);
        const result: InsertOneResult<T> = await collection.insertOne(document);
        if (result.acknowledged) {
            InsertResult.Success(Number(result.insertedId.id));
        }

        return InsertResult.Fail();
    }

    public async UpdateAsync<T extends object = object>(
        collectionName: string,
        filter: Filter<T>,
        update: UpdateFilter<T> | Partial<T>,
    ): Promise<UpdateResult> {
        const collection = this.GetCollection<T>(collectionName);
        const result: UpdateResultMongoDriver<T> = await collection.updateOne(filter, update);
        if (result.acknowledged) {
            UpdateResult.Success();
        }

        return UpdateResult.Fail();
    }

    public async DeleteAsync<T extends Object>(collectionName: string, filter: Filter<T>): Promise<DeleteResult> {
        const collection = this.GetCollection<T>(collectionName);
        const result: DeleteResultMongoDriver = await collection.deleteOne(filter);
        if (result.acknowledged) {
            DeleteResult.Success(result.deletedCount);
        }

        return DeleteResult.Fail();
    }

    private GetCollection<T extends Document>(collectionName: string): Collection<T> {
        if (this._collections[collectionName]) return this._collections[collectionName];

        this._collections[collectionName] = this._db.collection<T>(collectionName);

        return this._collections[collectionName];
    }

    [Symbol.dispose]() {
        this._mongoClient
            .close(true)
            .then()
            .catch((reason) => {
                throw new Error(reason);
            });
    }
}
