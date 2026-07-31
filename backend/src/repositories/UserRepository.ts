import { IUser, User } from '../models/User';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = this.model.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async findByEmployeeCode(employeeCode: string): Promise<IUser | null> {
    return this.model.findOne({ employeeCode: employeeCode.toUpperCase().trim() }).exec();
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return this.model.findById(id).select('+password').exec();
  }

  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase().trim() });
  }
}

export const userRepository = new UserRepository();

export default userRepository;
