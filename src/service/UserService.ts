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
  static createUser = async (data: { email: string; password: string }) => {
    console.log(data);

    return await prisma.user.create({
      data,
    });
  };
}

export default UserService;
