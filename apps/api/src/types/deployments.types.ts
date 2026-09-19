import { z } from "zod";

export const createDeploymentSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    agentName: z.string().min(1, "agentName is required"),
    framework: z.string().min(1, "framework is required"),
    repoFullName: z.string().min(1, "repoFullName is required"),
    cloneUrl: z.string().min(1, "cloneUrl is required"),
    branch: z.string().default("main"),
    isPrivate: z.coerce.boolean().default(false),
    rootDir: z.string().default("./"),
    buildCommand: z.string().default(""),
    runCommand: z.string().default(""),
    port: z.coerce.number().int().positive().default(8080),
    memory: z.string().default("1GB"),
    cpu: z.coerce.number().positive().default(1.0),
    scalingMode: z.string().default("serverless"),
    envVars: z
        .array(
            z.object({
                key: z.string().min(1, "key is required"),
                value: z.string(),
                isSecret: z.coerce.boolean().default(false),
            })
        )
        .default([]),
    commitSha: z.string().optional(),
    commitMessage: z.string().optional(),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
