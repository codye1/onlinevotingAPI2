import { prisma } from '../lib/prisma';

class UserService {
  static getUserByEmail = async (email: string) => {
    console.log('Fetching user by email:', email);
    return await prisma.user.findUnique({
      where: { email },
    });
  };
  static getUserById = async (id: number) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  };
  static createUser = async (data: { email: string; password: string }) => {
    return await prisma.user.create({
      data,
    });
  };
}

export default UserService;
