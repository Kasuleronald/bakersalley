
import { User } from '../types';

export type SyncMessageType = 'STATE_UPDATE' | 'USER_PRESENCE' | 'LOCK_ENTITY' | 'UNLOCK_ENTITY';

export interface SyncMessage {
  type: SyncMessageType;
  payload: any;
  senderId: string;
  senderName: string;
  timestamp: number;
}

const CHANNEL_NAME = 'bakemaster_sync_v1';

class SyncService {
  private channel: BroadcastChannel;
  private myId: string;
  private myName: string;
  private onMessageCallbacks: ((msg: SyncMessage) => void)[] = [];

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.myId = `peer-${Math.random().toString(36).substr(2, 9)}`;
    this.myName = 'Anonymous Baker';
    
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      if (event.data.senderId === this.myId) return;
      this.onMessageCallbacks.forEach(cb => cb(event.data));
    };
  }

  setIdentity(user: User | null) {
    if (user) {
      this.myName = user.name;
    }
  }

  broadcast(type: SyncMessageType, payload: any) {
    const message: SyncMessage = {
      type,
      payload,
      senderId: this.myId,
      senderName: this.myName,
      timestamp: Date.now()
    };
    this.channel.postMessage(message);
  }

  onMessage(callback: (msg: SyncMessage) => void) {
    this.onMessageCallbacks.push(callback);
    return () => {
      this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  getMyId() { return this.myId; }
}

export const syncService = new SyncService();
