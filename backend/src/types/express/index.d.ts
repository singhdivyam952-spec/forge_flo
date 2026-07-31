import { UserRole } from '../../constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
