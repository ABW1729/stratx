/*
  Warnings:

  - Added the required column `publishedDate` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Book` ADD COLUMN `publishedDate` DATETIME(3) NOT NULL;
