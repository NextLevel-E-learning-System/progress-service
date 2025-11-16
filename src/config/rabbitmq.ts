import amqplib from 'amqplib';
import { Options } from 'amqplib';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any | undefined;
const EXCHANGE_PROGRESS = process.env.EXCHANGE_PROGRESS || 'progress.events';

export async function connectRabbitMQ() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_PROGRESS, 'direct', { durable: true });
  channel.prefetch(20);
  return channel;
}

export interface UserDomainEvent<T=unknown> { type: string; payload: T; emittedAt: string; }

export async function publishEvent<T>(routingKey: string, payload: T, options?: Options.Publish) {
  if (!channel) await connectRabbitMQ();
  const evt: UserDomainEvent<T> = { type: routingKey, payload, emittedAt: new Date().toISOString() };
  channel!.publish(EXCHANGE_PROGRESS, routingKey, Buffer.from(JSON.stringify(evt)), { persistent: true, contentType: 'application/json', ...options });
}
