process.loadEnvFile();

import Fastify from "fastify";
import { prisma } from "@repo/db";

const fastify = Fastify({
    logger: true
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