
import CryptoJS from 'crypto-js';
import { User } from '../types';

const STORAGE_KEY = 'bakemaster_pro_secure_v2';
const CONFIG_KEY = 'bakemaster_cloud_config';
const AUTH_KEY = 'bakemaster_session_token';
const ENCRYPTION_KEY = 'BAKERY_LOCAL_ENCRYPTION_PASS_8821'; // Should ideally be unique per user device

interface CloudConfig {
  url: string;
  key: string;
  enabled: boolean;
}

class ApiClient {
  private getCloudConfig(): CloudConfig | null {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  private getToken(): string | null {
    return localStorage.getItem(AUTH_KEY);
  }

  private encryptData(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  private decryptData(ciphertext: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (e) {
      console.error("Local decryption failed. Possible key mismatch.");
      return null;
    }
  }

  async login(identity: string, password: string): Promise<{user: User, token: string} | null> {
    const config = this.getCloudConfig();
    if (!config?.url) return null;

    try {
      const response = await fetch(`${config.url}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(AUTH_KEY, data.token);
        return data;
      }
    } catch (e) {
      console.error("Login request failed:", e);
    }
    return null;
  }

  async getDb(): Promise<any> {
    const config = this.getCloudConfig();
    const token = this.getToken();
    
    if (config?.enabled && config.url && token) {
      try {
        const response = await fetch(`${config.url}?key=${config.key}&action=read`, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Authorization': token 
          }
        });
        if (response.ok) {
          const remoteData = await response.json();
          localStorage.setItem(STORAGE_KEY, this.encryptData(remoteData));
          return remoteData;
        }
      } catch (e) {
        console.warn("Cloud read failed, fallback to secure local cache");
      }
    }

    const secureData = localStorage.getItem(STORAGE_KEY);
    return secureData ? this.decryptData(secureData) : {};
  }

  async saveDb(data: any): Promise<void> {
    localStorage.setItem(STORAGE_KEY, this.encryptData(data));

    const config = this.getCloudConfig();
    const token = this.getToken();
    if (config?.enabled && config.url && token) {
      try {
        await fetch(`${config.url}?action=write`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token 
          },
          body: JSON.stringify({ data })
        });
      } catch (e) {
        console.error("Secure Cloud Sync Failed:", e);
      }
    }
  }

  async patchFullState(patch: any): Promise<any> {
    const db = await this.getDb();
    const updatedDb = { ...db, ...patch };
    await this.saveDb(updatedDb);
    return updatedDb;
  }

  async testConnection(url: string, key: string): Promise<boolean> {
    try {
      const res = await fetch(`${url}?key=${key}&action=ping`);
      return res.ok;
    } catch (e) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
