import express, { Request, Response, Router } from 'express';
import { AnyServiceEventListener, AnyServiceEventSubscriber } from '../../core';

export class PubSubPushMessageListener {
  private subscribers: { [topic: string]: _PubSubEventSubscriber };

  constructor() {
    this.subscribers = {};
  }

  async createSubscriber(topic: string): Promise<_PubSubEventSubscriber> {
    if (this.subscribers[topic]) {
      throw `subscriber for topic ${topic} already created`;
    }

    const subscriber = new _PubSubEventSubscriber();
    this.subscribers[topic] = subscriber;
    return subscriber;
  }

  listen(port: number, path?: string) {
    const app = express();
    app.use(express.json());
    app.post(path ?? '/', this.handlePushMessage.bind(this));
    app.listen(port);
  }

  router(path: string): Router {
    const router = Router();
    router.post(path, this.handlePushMessage);
    return router;
  }

  private async handlePushMessage(req: Request, res: Response) {
    if (!req.body) {
      const msg = 'no Pub/Sub message received';
      console.error(`error: ${msg}`);
      return res.status(400).send(`Bad Request: ${msg}`);
    }

    if (!req.body.message) {
      const msg = 'invalid Pub/Sub message format';
      console.error(`error: ${msg}`);
      return res.status(400).send(`Bad Request: ${msg}`);
    }

    const message = req.body.message;
    if (!message.data) {
      const msg = 'invalid service message format';
      console.error(`error: ${msg}`);
      return res.status(400).send(`Bad Request: ${msg}`);
    }

    const topic = message.attributes.topic as string;
    if (!topic) {
      const msg = 'invalid service message format (no topic in attributes)';
      console.error(`error: ${msg}`);
      return res.status(400).send(`Bad Request: ${msg}`);
    }

    const subscriber = this.subscribers[topic];
    if (!subscriber) {
      const msg = 'no topic subscriber';
      console.warn(`warning: ${msg}`);
      return res.status(200).send(`Skip: ${msg}`);
    }

    try {
      await subscriber.handleMessage(message);
      res.status(200);
    } catch (e) {
      res.status(400);
    }
    return res.send();
  }
}

class _PubSubEventSubscriber implements AnyServiceEventSubscriber {
  private listeners: { [name: string]: AnyServiceEventListener };
  private anyListener?: AnyServiceEventListener;

  constructor() {
    this.listeners = {};
  }

  async handleMessage(pubsubData: string): Promise<void> {
    const event = JSON.parse(
      Buffer.from(pubsubData, 'base64').toString().trim()
    );

    const { name, data } = event;
    const listener = this.listeners[name] ?? this.anyListener;
    if (!listener) {
      return;
    }

    await listener(data);
  }

  on(name: string, listener: AnyServiceEventListener): void {
    if (name === '*') {
      this.anyListener = listener;
      return;
    }
    this.listeners[name] = listener;
  }
}
