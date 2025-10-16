import amqp from "amqplib";
import { redisClient } from "../server.js";
import { sql } from "./db.js";

interface CacheInvalidation {
  action: string;
  keys: string[];
}

export const startCacheConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: "localhost",
      port: 5672,
      username: "guest",
      password: "guest",
    });

    const channel = await connection.createChannel();
    const queueName = "cache-invalidation";

    await channel.assertQueue(queueName, { durable: true });
    console.log("✅ Blog service cache consumer started");

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(
            msg.content.toString()
          ) as CacheInvalidation;

          console.log(
            "📩 Blog service received cache invalidation message: ",
            content
          );

          if (content.action === "invalidateCache") {
            for (const pattern of content.keys) {
              const keys = await redisClient.keys(pattern);
              if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(
                  `🚮 Blog service invalidated ${keys.length} cache keys matching: ${pattern}`
                );

                const searchQuery = "";
                const category = "";

                const cacheKey = `blogs:${searchQuery}:${category}`;

                const blogs =
                  await sql`SELECT * FROM blogs ORDER BY created_at DESC`;

                await redisClient.set(
                  cacheKey,
                  JSON.stringify(blogs),
                  "EX",
                  3600
                );

                console.log(
                  `📦 Blog service cached ${blogs.length} blogs for search query: ${searchQuery} and category: ${category}`
                );
              }
            }
          }
          channel.ack(msg);
        } catch (error: any) {
          console.error(
            "❌ Blog service cache consumer failed to process message",
            error.message
          );
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error: any) {
    console.error(
      "❌ Blog service cache consumer failed to start",
      error.message
    );
  }
};
