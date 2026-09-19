-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('QUEUED', 'BUILDING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "cloneUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "rootDir" TEXT NOT NULL DEFAULT './',
    "buildCommand" TEXT NOT NULL,
    "runCommand" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 8080,
    "memory" TEXT NOT NULL DEFAULT '1GB',
    "cpu" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scalingMode" TEXT NOT NULL DEFAULT 'serverless',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvVar" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL,
    "agentId" INTEGER NOT NULL,

    CONSTRAINT "EnvVar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "agentId" INTEGER NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'QUEUED',
    "commitSha" TEXT,
    "commitMessage" TEXT,
    "jobName" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnvVar" ADD CONSTRAINT "EnvVar_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
