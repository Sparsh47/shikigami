process.loadEnvFile();

import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { userRoutes } from "./routes/deployments.routes.js";

const fastify = Fastify({
    logger: true
});

await fastify.register(cors, {
    origin: true, // Allow frontend requests
    credentials: true,
});

fastify.register(userRoutes, {
    prefix: "/api/deployments"
});

fastify.get("/", async function (reqeust, reply) {
    await prisma.$queryRaw`SELECT 1`;
    reply.send({ hello: "world" });
})

fastify.listen({ port: 8080 }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});