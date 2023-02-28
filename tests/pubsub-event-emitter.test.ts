/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Message, PubSub, Subscription, Topic } from "@google-cloud/pubsub";
import { config } from 'dotenv';
import { PubSubServiceEventEmitter } from '../src/infra/pubsub';
config({ path: './.simulator/pubsub/.env' });

const pubsub = new PubSub();
let topic: Topic;
let subscription: Subscription;

function pullMessage(): Promise<Message | null> {
    return new Promise<Message | null>((resolve) => {
        const messageHandler = (message: Message) => {
            resolve(message);
            subscription.off('message', messageHandler);
        };
        setTimeout(() => {
            resolve(null);
            subscription.off('message', messageHandler);
        }, 500);
        subscription.on('message', messageHandler);
    });
}

beforeAll(async () => {
    topic = pubsub.topic("topic");
    const [exists] = await topic.exists();
    if (!exists) {
        await topic.create();
    }
});

beforeEach(async () => {
    subscription = topic.subscription("subscription");
    const [exists] = await subscription.exists();
    if (exists) {
        await subscription.delete();
    }
    await subscription.create();
});

test("pubsub", async () => {
    const emitter = new PubSubServiceEventEmitter({ topic });
    await emitter.emit("TEST", { arg: "arg" });
    const message = await pullMessage();
    const content = JSON.parse(message!.data.toString());
    expect(message).not.toBeNull();
    expect(content.name).toBe("TEST");
    expect(content.data.arg).toBe("arg");
});