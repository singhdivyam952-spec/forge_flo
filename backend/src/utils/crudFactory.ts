import { Router, Request, Response } from 'express';
import { Document, Model, FilterQuery } from 'mongoose';
import { z, ZodTypeAny } from 'zod';
import { BaseRepository } from '../repositories/BaseRepository';
import { asyncHandler } from './asyncHandler';
import { ApiResponse } from './apiResponse';
import { parsePagination } from './pagination';
import { AppError } from './AppError';
import { authenticate } from '../middleware/auth';
import { requirePermissions } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { generateDocumentNumber } from './documentNumber';
import { audit } from '../middleware/audit';
import { AuditAction } from '../constants';

export interface CrudModuleOptions<T extends Document> {
  model: Model<T>;
  resourceName: string;
  routePath: string;
  permissions: {
    create: string;
    read: string;
    update: string;
    delete: string;
  };
  searchFields?: string[];
  populate?: string[];
  createSchema?: ZodTypeAny;
  updateSchema?: ZodTypeAny;
  /** Auto-generate document number field on create */
  documentNumber?: {
    field: string;
    prefix: string;
  };
  /** Extra filter builders from query params */
  filterKeys?: string[];
  /** Hook before create */
  beforeCreate?: (data: Record<string, unknown>, req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Hook after create */
  afterCreate?: (doc: T, req: Request) => Promise<void> | void;
  /** Hook before update */
  beforeUpdate?: (id: string, data: Record<string, unknown>, req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Custom routes appended after CRUD */
  extraRoutes?: (router: Router, repo: BaseRepository<T>) => void;
}

const idParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Builds a full CRUD service + controller + router for a Mongoose model.
 * Domain modules with complex business logic should extend / wrap this.
 */
export function createCrudModule<T extends Document>(options: CrudModuleOptions<T>) {
  const repo = new BaseRepository<T>(options.model);
  const searchFields = options.searchFields ?? ['name', 'code'];

  const service = {
    repo,
    async list(req: Request) {
      const { page, limit, sort, search, filters } = parsePagination(req);
      const filter: FilterQuery<T> = {};

      for (const key of options.filterKeys ?? ['status', 'type', 'isActive']) {
        if (filters[key] !== undefined) {
          (filter as Record<string, unknown>)[key] = filters[key];
        }
      }

      return repo.findAll({
        filter,
        page,
        limit,
        sort,
        search,
        searchFields,
        populate: options.populate,
      });
    },

    async getById(id: string) {
      const doc = await repo.findById(id, { populate: options.populate });
      if (!doc) throw AppError.notFound(`${options.resourceName} not found`);
      return doc;
    },

    async create(req: Request) {
      let data = { ...(req.body as Record<string, unknown>) };

      if (options.documentNumber) {
        const number = await generateDocumentNumber({ prefix: options.documentNumber.prefix });
        data[options.documentNumber.field] = number;
      }

      if (req.user) {
        data.createdBy = req.user.id;
        data.updatedBy = req.user.id;
      }

      if (options.beforeCreate) {
        data = await options.beforeCreate(data, req);
      }

      const doc = await repo.create(data as Partial<T>);
      if (options.afterCreate) await options.afterCreate(doc, req);
      return doc;
    },

    async update(id: string, req: Request) {
      let data = { ...(req.body as Record<string, unknown>) };
      if (req.user) data.updatedBy = req.user.id;
      if (options.beforeUpdate) {
        data = await options.beforeUpdate(id, data, req);
      }
      const doc = await repo.updateById(id, data as never);
      if (!doc) throw AppError.notFound(`${options.resourceName} not found`);
      return doc;
    },

    async remove(id: string, req: Request) {
      const doc = await repo.deleteById(id, req.user?.id);
      if (!doc) throw AppError.notFound(`${options.resourceName} not found`);
      return doc;
    },
  };

  const controller = {
    list: asyncHandler(async (req: Request, res: Response) => {
      const result = await service.list(req);
      return ApiResponse.paginated(res, result.data, result.meta);
    }),
    get: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.getById(req.params.id);
      return ApiResponse.success(res, doc);
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.create(req);
      res.locals.createdDoc = doc;
      return ApiResponse.created(res, doc, `${options.resourceName} created`);
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      const doc = await service.update(req.params.id, req);
      return ApiResponse.success(res, doc, `${options.resourceName} updated`);
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await service.remove(req.params.id, req);
      return ApiResponse.success(res, null, `${options.resourceName} deleted`);
    }),
  };

  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermissions(options.permissions.read), controller.list);
  router.get(
    '/:id',
    requirePermissions(options.permissions.read),
    validate({ params: idParamSchema }),
    controller.get
  );
  router.post(
    '/',
    requirePermissions(options.permissions.create),
    audit({
      action: AuditAction.Create,
      module: options.routePath.replace(/^\//, ''),
      entityType: options.resourceName,
      getEntityId: (_req, res) => String((res.locals.createdDoc as { _id?: unknown } | undefined)?._id ?? ''),
    }),
    ...(options.createSchema ? [validate({ body: options.createSchema })] : []),
    controller.create
  );
  router.put(
    '/:id',
    requirePermissions(options.permissions.update),
    audit({
      action: AuditAction.Update,
      module: options.routePath.replace(/^\//, ''),
      entityType: options.resourceName,
      getEntityId: (req) => req.params.id,
    }),
    validate({ params: idParamSchema }),
    ...(options.updateSchema ? [validate({ body: options.updateSchema })] : []),
    controller.update
  );
  router.patch(
    '/:id',
    requirePermissions(options.permissions.update),
    audit({
      action: AuditAction.Update,
      module: options.routePath.replace(/^\//, ''),
      entityType: options.resourceName,
      getEntityId: (req) => req.params.id,
    }),
    validate({ params: idParamSchema }),
    ...(options.updateSchema ? [validate({ body: options.updateSchema })] : []),
    controller.update
  );
  router.delete(
    '/:id',
    requirePermissions(options.permissions.delete),
    audit({
      action: AuditAction.Delete,
      module: options.routePath.replace(/^\//, ''),
      entityType: options.resourceName,
      getEntityId: (req) => req.params.id,
    }),
    validate({ params: idParamSchema }),
    controller.remove
  );

  if (options.extraRoutes) options.extraRoutes(router, repo);

  return { router, service, controller, repo, routePath: options.routePath };
}

export default createCrudModule;
