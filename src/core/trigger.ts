export interface ServiceTriggerSubscriber {
  on(callback: () => unknown): void;
}
