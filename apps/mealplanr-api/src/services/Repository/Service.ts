import { Model, UpdateQuery, DocumentDefinition, FilterQuery } from 'mongoose';
import Logger from '../../config/Logger';
import { PaginationModel } from '../../models/util/PaginationModel';
import { Repository } from './Repository';

export abstract class Service<EntityDocument, EntityModel, EntityResponse> {
	protected repository: Repository<EntityDocument, EntityModel>;

	constructor(model: Model<EntityDocument>) {
		this.repository = new Repository<EntityDocument, EntityModel>(model);
	}

	public abstract populate(document: EntityDocument): Promise<EntityResponse>;

	public async getById(_id: string): Promise<EntityResponse> {
		return this.populate(await this.repository.findOne({ _id }));
	}

	public async findOne(
		query: FilterQuery<EntityModel>
	): Promise<EntityResponse | null> {
		try {
			return this.populate(await this.repository.findOne(query));
		} catch (error) {
			Logger.error(error);
			return null;
		}
	}

	public async exists(_id: string): Promise<boolean> {
		return this.repository.exists({ _id });
	}

	public async getPaginated(
		query: FilterQuery<EntityModel>,
		limit: number,
		page = 0,
		fields?: string,
		sort = ''
	): Promise<PaginationModel<EntityDocument>> {
		const skip: number = (Math.max(1, page) - 1) * limit;
		const count = await this.repository.count(query);
		let docs = await this.repository.find(query, sort, skip, limit);

		const fieldArray = (fields || '')
			.split(',')
			.map((field) => field.trim())
			.filter(Boolean);
		if (fieldArray.length)
			docs = docs.map((d) => {
				const attrs: any = {};
				fieldArray.forEach((f) => (attrs[f] = (d as any)[f]));
				return attrs;
			});
		return new PaginationModel<EntityDocument>({
			count,
			page,
			limit,
			docs,
			totalPages: Math.ceil(count / limit),
		});
	}

	public async create(
		entity: DocumentDefinition<EntityDocument>
	): Promise<EntityResponse> {
		const res = await this.repository.create(entity);
		return this.getById((res as any)._id);
	}

	public async update(
		id: string,
		entity: UpdateQuery<EntityDocument>
	): Promise<EntityResponse> {
		await this.repository.update(id, entity);
		return this.getById(id);
	}

	public async delete(id: string): Promise<void> {
		const res = await this.repository.delete(id);
		if (!res.n) throw new Error();
	}
}