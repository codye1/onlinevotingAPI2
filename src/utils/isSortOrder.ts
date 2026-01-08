import { Prisma } from '../../generated/prisma/client';

const isSortOrder = (v?: string): v is Prisma.SortOrder =>
  v === 'asc' || v === 'desc';

export default isSortOrder;
