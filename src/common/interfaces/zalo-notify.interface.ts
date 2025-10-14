export interface ZaloNotifyPayload {
  app_trans_id: string;
  orderId?: string;
  amount: number;
  status: number;
  timestamp: number;
  mac: string;
  messageToken?: string;
  description?: string;
}
