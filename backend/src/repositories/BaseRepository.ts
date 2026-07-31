import {
  Document,
  FilterQuery,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { buildPaginationMeta, PaginationMeta } from '../utils/apiResponse';
import { buildSearchFilter } from '../utils/pagination';

export interface FindAllOptions<T> {
  filter?: FilterQuery<T>;
  page?: number;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  search?: string;
  searchFields?: string[];
  populate?: (PopulateOptions | string)[];
  select?: ProjectionType<T>;
  includeDeleted?: boolean;
}

export interface FindAllResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Generic MongoDB/Mongoose repository providing common CRUD operations,
 * pagination, and soft-delete support so feature repositories only need to
 * implement domain-specific queries.
 *
 * Soft delete convention: documents that opt in must have `isDeleted`
 * (boolean) and `deletedAt` (Date) fields on their schema. When absent,
 * `delete()` transparently falls back to a hard delete.
 */
export class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;
  protected readonly supportsSoftDelete: boolean;

  constructor(model: Model<T>) {
    this.model = model;
    this.supportsSoftDelete = !!model.schema.path('isDeleted');
  }

  private notDeletedFilter(includeDeleted = false): FilterQuery<T> {
    if (!this.supportsSoftDelete || includeDeleted) return {};
    return { isDeleted: { $ne: true } } as FilterQuery<T>;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const docs = await this.model.insertMany(data);
    return docs as unknown as T[];
  }

  async findById(
    id: string | Types.ObjectId,
    options: { populate?: (PopulateOptions | string)[]; select?: ProjectionType<T>; includeDeleted?: boolean } = {}
  ): Promise<T | null> {
    const filter = { _id: id, ...this.notDeletedFilter(options.includeDeleted) } as FilterQuery<T>;
    const query = this.model.findOne(filter);
    if (options.select) query.select(options.select);
    if (options.populate) query.populate(options.populate as PopulateOptions[]);
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    options: { populate?: (PopulateOptions | string)[]; select?: ProjectionType<T>; includeDeleted?: boolean } = {}
  ): Promise<T | null> {
    const finalFilter = { ...filter, ...this.notDeletedFilter(options.includeDeleted) } as FilterQuery<T>;
    const query = this.model.findOne(finalFilter);
    if (options.select) query.select(options.select);
    if (options.populate) query.populate(options.populate as PopulateOptions[]);
    return query.exec();
  }

  async findAll(options: FindAllOptions<T> = {}): Promise<FindAllResult<T>> {
    const {
      filter = {},
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      search,
      searchFields = [],
      populate,
      select,
      includeDeleted = false,
    } = options;

    const skip = options.skip ?? (page - 1) * limit;

    const searchFilter = search ? buildSearchFilter(search, searchFields) : undefined;

    const finalFilter: FilterQuery<T> = {
      ...filter,
      ...this.notDeletedFilter(includeDeleted),
      ...(searchFilter ?? {}),
    } as FilterQuery<T>;

    const query = this.model.find(finalFilter).sort(sort).skip(skip).limit(limit);
    if (select) query.select(select);
    if (populate) query.populate(populate as PopulateOptions[]);

    const [data, totalItems] = await Promise.all([
      query.exec(),
      this.model.countDocuments(finalFilter).exec(),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, totalItems) };
  }

  async updateById(id: string | Types.ObjectId, update: UpdateQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ _id: id, ...this.notDeletedFilter() } as FilterQuery<T>, update, {
        new: true,
        runValidators: true,
        ...options,
      })
      .exec();
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany({ ...filter, ...this.notDeletedFilter() } as FilterQuery<T>, update).exec();
    return result.modifiedCount ?? 0;
  }

  /** Soft-deletes the document if supported, otherwise performs a hard delete. */
  async deleteById(id: string | Types.ObjectId, deletedBy?: string | Types.ObjectId): Promise<T | null> {
    if (this.supportsSoftDelete) {
      const update = {
        isDeleted: true,
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      } as UpdateQuery<T>;
      return this.model.findOneAndUpdate({ _id: id } as FilterQuery<T>, update, { new: true }).exec();
    }
    return this.model.findOneAndDelete({ _id: id } as FilterQuery<T>).exec();
  }

  async hardDeleteById(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findOneAndDelete({ _id: id } as FilterQuery<T>).exec();
  }

  async restoreById(id: string | Types.ObjectId): Promise<T | null> {
    if (!this.supportsSoftDelete) return null;
    const update = { isDeleted: false, deletedAt: null, deletedBy: null } as UpdateQuery<T>;
    return this.model.findOneAndUpdate({ _id: id } as FilterQuery<T>, update, { new: true }).exec();
  }

  async count(filter: FilterQuery<T> = {}, includeDeleted = false): Promise<number> {
    return this.model.countDocuments({ ...filter, ...this.notDeletedFilter(includeDeleted) } as FilterQuery<T>).exec();
  }

  async exists(filter: FilterQuery<T>, includeDeleted = false): Promise<boolean> {
    const doc = await this.model.exists({ ...filter, ...this.notDeletedFilter(includeDeleted) } as FilterQuery<T>);
    return !!doc;
  }
}

export default BaseRepository;
