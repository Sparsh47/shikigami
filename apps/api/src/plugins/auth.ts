import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// Augment FastifyRequest so every handler gets `request.userId`
declare module "fastify" {
    interface FastifyRequest {
        userId: string;
    }
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
    // Decorate every request with an empty userId; the hook fills it in.
    fastify.decorateRequest("userId", "");

    fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
        const secret = request.headers["x-internal-secret"];

        // Reject anything that didn't come through our Next.js proxy
        if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const userId = request.headers["x-user-id"];

        if (!userId || typeof userId !== "string" || userId.trim() === "") {
            return reply.status(401).send({ error: "Missing authenticated user" });
        }

        request.userId = userId.trim();
    });
});
