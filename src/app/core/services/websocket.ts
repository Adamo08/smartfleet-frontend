import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Stomp.Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageSubject = new BehaviorSubject<WebSocketMessage | null>(null);
  private stateSubject = new BehaviorSubject<WebSocketState>({
    connected: false,
    connecting: false,
    error: null
  });

  public messages$ = this.messageSubject.asObservable();
  public state$ = this.stateSubject.asObservable();

  constructor() {}

  connect(userEmail?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient && this.stompClient.connected) {
        resolve();
        return;
      }

      this.updateState({ connecting: true, error: null });

      // Use SockJS instead of raw WebSocket
      const socket = new (SockJS as any)(environment.wsUrl);
      this.stompClient = Stomp.over(socket);

      // Disable STOMP debug logging in production
      if (this.stompClient.debug) {
        this.stompClient.debug = () => {}; // Empty function instead of null
      }

      // Get authentication token
      const token = localStorage.getItem('accessToken');
      const headers: any = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      this.stompClient.connect(headers, () => {
        console.log('STOMP connected successfully');
        this.updateState({ connected: true, connecting: false, error: null });
        this.reconnectAttempts = 0;

        if (userEmail) {
          this.subscribeToUserNotifications(userEmail);
        }
        resolve();
      }, (error: string | Stomp.Frame) => {
        console.error('STOMP connection error:', error);
        this.updateState({ connected: false, connecting: false, error: 'Connection error' });
        this.scheduleReconnect(userEmail);
        reject(error);
      });
    });
  }

  private subscribeToUserNotifications(userEmail: string): void {
    if (this.stompClient && this.stompClient.connected) {
      const destination = `/user/${userEmail}/queue/notifications`;

      this.stompClient.subscribe(destination, (message) => {
        try {
          console.log(`Received message on ${destination}:`, message);
          const body = JSON.parse(message.body);
          const webSocketMessage: WebSocketMessage = {
            ...body,
            timestamp: new Date()
          };
          this.messageSubject.next(webSocketMessage);
          console.log('Received STOMP message:', webSocketMessage);
        } catch (error) {
          console.error('Error parsing STOMP message:', error);
        }
      });
      console.log(`Subscribed to user notifications at ${destination}`);
    } else {
      console.warn('STOMP client is not connected. Cannot subscribe.');
    }
  }

  send(destination: string, message: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(message));
    } else {
      console.warn('STOMP client is not connected. Message not sent.');
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('STOMP disconnected successfully');
        this.updateState({ connected: false, connecting: false, error: null });
      });
      this.stompClient = null;
    }
  }

  private scheduleReconnect(userEmail?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateState({ error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect(userEmail).then(
        r => console.log('Reconnected successfully')
      );
    }, delay);
  }

  private updateState(updates: Partial<WebSocketState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates
    });
  }

  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }
}
