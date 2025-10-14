// interfaces/zalo-webhook.interface.ts
export interface ZaloWebhookEvent {
  event: string;
  appId: string;
  userId: string;
  timestamp: number;
}
