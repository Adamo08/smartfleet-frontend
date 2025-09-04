import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

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
  private stompClient: Client | null = null;
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

  constructor() {
    console.log('🔧 WebSocketService initialized');
  }

  connect(userEmail?: string): Promise<void> {
    console.log('🔌 WebSocketService.connect() called with userEmail:', userEmail);

    return new Promise((resolve, reject) => {
      if (this.stompClient && this.stompClient.connected) {
        console.log('✅ WebSocket already connected, skipping connection');
        resolve();
        return;
      }

      console.log('🔄 Starting WebSocket connection...');
      this.updateState({ connecting: true, error: null });

      // Create new StompJS client
      console.log('🔧 Creating STOMP client for:', environment.wsUrl);
      this.stompClient = new Client({
        brokerURL: undefined, // We'll use webSocketFactory instead
        webSocketFactory: () => new SockJS(environment.wsUrl),
        debug: (str) => {
          // Disable debug logging in production
          if (!environment.production) {
            console.log('STOMP: ' + str);
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // Get authentication token
      const token = localStorage.getItem('accessToken');
      const headers: any = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using JWT token for WebSocket authentication');
        console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ No JWT token found in localStorage');
      }

      console.log('🔧 STOMP connection headers:', headers);

      // Set up connection handlers
      this.stompClient.onConnect = (frame) => {
        console.log('✅ STOMP connected successfully');
        console.log('🔧 STOMP client state:', this.stompClient);
        this.updateState({ connected: true, connecting: false, error: null });
        this.reconnectAttempts = 0;

        if (userEmail) {
          console.log('🔧 User email provided, subscribing to notifications');
          this.subscribeToUserNotifications(userEmail);
        } else {
          console.warn('⚠️ No user email provided for notification subscription');
        }
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('❌ STOMP connection error:', frame);
        console.error('❌ Error details:', frame.headers);
        this.updateState({ connected: false, connecting: false, error: 'Connection error' });
        this.scheduleReconnect(userEmail);
        reject(frame);
      };

      this.stompClient.onWebSocketError = (event) => {
        console.error('❌ WebSocket error:', event);
        this.updateState({ connected: false, connecting: false, error: 'WebSocket error' });
        this.scheduleReconnect(userEmail);
        reject(event);
      };

      // Set connection headers and activate
      this.stompClient.connectHeaders = headers;
      this.stompClient.activate();
    });
  }

  private subscribeToUserNotifications(userEmail: string): void {
    console.log('🔧 subscribeToUserNotifications() called with userEmail:', userEmail);

    if (this.stompClient && this.stompClient.connected) {
      const destination = `/user/${userEmail}/queue/notifications`;
      console.log('📡 Subscribing to destination:', destination);
      console.log('🔧 STOMP client connected state:', this.stompClient.connected);

      this.stompClient.subscribe(destination, (message: any) => {
        console.log('📨 === WebSocket Message Received ===');
        console.log('📨 Raw message:', message);
        console.log('📨 Message body:', message.body);
        console.log('📨 Message headers:', message.headers);
        console.log('📨 Destination:', destination);

        try {
          const body = JSON.parse(message.body);
          console.log('📨 Parsed message body:', body);

          const webSocketMessage: WebSocketMessage = {
            // Use the type from the parsed body, or a default if not present
            type: body.type || 'GENERAL_UPDATE',
            payload: body, // Assign the entire parsed body as the payload
            timestamp: new Date()
          };

          console.log('📨 Created WebSocketMessage:', webSocketMessage);
          console.log('📨 Emitting message to messageSubject...');

          this.messageSubject.next(webSocketMessage);

          console.log('✅ Message successfully emitted to messageSubject');
        } catch (error) {
          console.error('❌ Error parsing STOMP message:', error);
          console.error('❌ Raw message body:', message.body);
        }
      });

      console.log(`✅ Successfully subscribed to user notifications at ${destination}`);
    } else {
      console.warn('⚠️ STOMP client is not connected. Cannot subscribe.');
      console.warn('⚠️ STOMP client state:', this.stompClient);
    }
  }

  send(destination: string, message: any): void {
    console.log('📤 WebSocketService.send() called');
    console.log('📤 Destination:', destination);
    console.log('📤 Message:', message);

    if (this.stompClient && this.stompClient.connected) {
      console.log('✅ STOMP client connected, sending message');
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
      console.log('✅ Message sent successfully');
    } else {
      console.warn('⚠️ STOMP client is not connected. Message not sent.');
      console.warn('⚠️ STOMP client state:', this.stompClient);
    }
  }

  disconnect(): void {
    console.log('🔌 WebSocketService.disconnect() called');

    if (this.stompClient && this.stompClient.connected) {
      console.log('🔄 Disconnecting STOMP client...');
      this.stompClient.onDisconnect = () => {
        console.log('✅ STOMP disconnected successfully');
        this.updateState({ connected: false, connecting: false, error: null });
      };
      this.stompClient.deactivate();
      this.stompClient = null;
    } else {
      console.log('ℹ️ STOMP client already disconnected or null');
    }
  }

  private scheduleReconnect(userEmail?: string): void {
    console.log('🔄 scheduleReconnect() called');

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.updateState({ error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      console.log(`🔄 Executing reconnection attempt ${this.reconnectAttempts}`);
      this.connect(userEmail).then(
        r => console.log('✅ Reconnected successfully')
      ).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  private updateState(updates: Partial<WebSocketState>): void {
    console.log('🔧 WebSocket state update:', updates);
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates
    });
  }

  isConnected(): boolean {
    const connected = this.stompClient?.connected || false;
    console.log('🔧 WebSocket isConnected() called, returning:', connected);
    return connected;
  }
}