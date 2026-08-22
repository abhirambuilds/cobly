import User, { IUser } from '../models/User';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  /**
   * Converts a Mongoose IUser document into a safe API representation,
   * stripping out sensitive fields like passwordHash.
   */
  static toSafeUser(user: IUser): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Retrieves a user by ID and returns their safe profile.
   */
  static async getUserProfile(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return this.toSafeUser(user);
  }
}
