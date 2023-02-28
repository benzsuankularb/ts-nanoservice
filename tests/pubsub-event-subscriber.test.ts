/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PubSub, Topic } from "@google-cloud/pubsub";
import { config } from 'dotenv';
import { PubSubServiceEventSubscriber } from '../src/infra/pubsub/event';
config({ path: './.simulator/pubsub/.env' });

const pubsub = new PubSub();
let topic: Topic;
let subscriber: PubSubServiceEventSubscriber;
const PORT = 8090;

function wait(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

beforeAll(async () => {
    topic = pubsub.topic("topic");
    subscriber = new PubSubServiceEventSubscriber({ port: PORT });
    const [exists] = await topic.exists();
    if (!exists) {
        await topic.create();
    }
});

beforeEach(async () => {
    const subscription = topic.subscription("subscription");
    const [exists] = await subscription.exists();
    if (exists) {
        await subscription.delete();
    }
    await subscription.create({
        pushConfig: {
            pushEndpoint: `http://localhost:${PORT}`
        },
    });
});

test("received event", async () => {
    const datas: unknown[] = [];
    subscriber.on("TEST_SUBSCRIBER", async (data) => {
        datas.push(data);
        return true;
    });
    await topic.publishMessage({ json: {name: "TEST_SUBSCRIBER", data: { arg: "arg" } } });
    await wait(100);
    expect(datas.length).toBe(1);
    expect(datas[0]).toEqual({ arg: "arg" });
});

test("unack", async () => {
    const datas: unknown[] = [];
    subscriber.on("TEST_SUBSCRIBER", async (data) => {
        datas.push(data);
        return datas.length === 2;
    });
    await topic.publishMessage({ json: {name: "TEST_SUBSCRIBER", data: { arg: "arg" } } });
    await wait(3000);
    expect(datas.length).toBe(2);
    expect(datas[0]).toEqual({ arg: "arg" });
    expect(datas[1]).toEqual({ arg: "arg" });
});