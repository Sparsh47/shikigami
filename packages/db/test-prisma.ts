import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.deployment.findMany({
            where: { agent: { userId: "12345" } },
            orderBy: { createdAt: "desc" },
            include: {
                agent: {
                    select: {
                        agentName: true,
                        repoFullName: true,
                        branch: true,
                        framework: true,
                    },
                },
            },
        });
        console.log("Success");
    } catch (e) {
        console.error(e);
    }
}
main();
