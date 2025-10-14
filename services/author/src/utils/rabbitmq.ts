import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: "localhost",
      port: 5672,
      username: "guest",
      password: "guest",
    });

    channel = await connection.createChannel();
    console.log("✅ Connected to RabbitMQ.");
  } catch (error: any) {
    console.error("❌ Failed to connect to RabbitMQ:", error.message);
  }
};

export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    await connectRabbitMQ();
  }

  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

export const invalidateCacheJob = async (cacheKeys: string[]) => {
  try {
    const message = {
      action: "invalidateCache",
      keys: cacheKeys,
    };

    await publishToQueue("cache-invalidation",message)
    console.log("Cache invalidation job published to RabbitMQ")
} catch (error:any) {
    console.error("Failed to publish cache on RabbitMQ", error.message)
}
};
