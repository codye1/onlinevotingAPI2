import { prisma } from '../lib/prisma';

class UserService {
  static getUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({
      where: { email },
    });
  };
  static getUserById = async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  };
  static createUser = async (data: {
    email: string;
    password?: string;
    provider: string;
  }) => {
    return await prisma.user.create({
      data,
    });
  };
  static updateById = async (
    id: string,
    data: Partial<{
      email: string;
      password: string;
      name: string;
      provider: string;
    }>,
  ) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  };
}

export default UserService;
