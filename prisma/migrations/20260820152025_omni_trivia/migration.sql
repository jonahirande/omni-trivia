-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('standard', 'kids');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('starter', 'easy', 'medium', 'hard', 'expert', 'pro');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('quick_play', 'adventure', 'live_multiplayer');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "countryCode" CHAR(2),
    "accountType" "AccountType" NOT NULL DEFAULT 'standard',
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isKidsSafe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "promptText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "timeLimitSec" INTEGER NOT NULL DEFAULT 15,
    "basePoints" INTEGER NOT NULL DEFAULT 100,
    "isKidsSafe" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "gameMode" "GameMode" NOT NULL,
    "score" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
