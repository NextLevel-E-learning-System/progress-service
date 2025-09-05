// Tipos de amqplib podem variar; usar import genérico e tipar minimamente.
import { connect, Channel } from 'amqplib';
import { randomUUID } from 'crypto';
import { DomainEvent } from './contracts.js';
import { logger } from '../config/logger.js';

interface SimpleConnection { createChannel: () => Promise<Channel>; close?: () => Promise<void>; }
let connection: SimpleConnection | null = null;
let channel: Channel | null = null;
const EXCHANGE = process.env.RABBIT_EXCHANGE || 'domain.events';

export async function initEventBus(){
  if(channel) return channel;
  const url = process.env.RABBITMQ_URL;
  if(!url){ logger.warn('RABBITMQ_URL not set, events disabled'); return null; }
  const conn = await connect(url) as unknown as SimpleConnection; // adapt
  connection = conn;
  channel = await conn.createChannel();
  if(channel) await channel.assertExchange(EXCHANGE,'topic',{ durable:true });
  logger.info({ EXCHANGE }, 'event_bus_initialized');
  return channel;
}

export async function publishEvent<T>(evt: Omit<DomainEvent<T>, 'eventId' | 'occurredAt' | 'version'> & { version?:number }){
  if(!channel) await initEventBus();
  if(!channel) return;
  const event: DomainEvent<T> = {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    version: evt.version ?? 1,
    ...evt
  };
  const key = event.type;
  if(channel) channel.publish(EXCHANGE, key, Buffer.from(JSON.stringify(event)), { contentType:'application/json', persistent:true });
  logger.info({ eventType: event.type, eventId: event.eventId }, 'event_published');
}

export async function closeEventBus(){
  try {
    if(channel) await channel.close();
  if(connection?.close) await connection.close();
  } catch (err) {
    logger.error({ err }, 'error_closing_event_bus');
  } finally {
    channel = null; connection = null;
  }
}