process.loadEnvFile();

import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { userRoutes } from "./routes/deployments.routes.js";
import { authPlugin } from "./plugins/auth.js";

const fastify = Fastify({
    logger: true
});

await fastify.register(cors, {
    origin: true,
    credentials: true,
});

// All deployment routes require the internal secret + a verified GitHub userId
await fastify.register(authPlugin);

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