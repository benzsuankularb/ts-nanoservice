import { Topic } from '@google-cloud/pubsub';
import { AnyServiceEventEmitter } from '../../core';

export interface PubSubServiceEventEmitterOptions {
  topic: Topic;
}

export class PubSubServiceEventEmitter implements AnyServiceEventEmitter {
  private topic: Topic;

  static create<T extends PubSubServiceEventEmitter>(
    options: PubSubServiceEventEmitterOptions
  ): T {
    return new this(options) as unknown as T;
  }

  constructor(options: PubSubServiceEventEmitterOptions) {
    this.topic = options.topic;
  }

  async emit(name: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      this.topic.publishMessage(
        {
          json: { name, data }
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
