/*
  Warnings:

  - You are about to drop the column `interval` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `Poll` table. All the data in the column will be lost.
  - Added the required column `resultsVisibility` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voteInterval` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "interval",
DROP COLUMN "visibility",
ADD COLUMN     "resultsVisibility" TEXT NOT NULL,
ADD COLUMN     "voteInterval" TEXT NOT NULL;
