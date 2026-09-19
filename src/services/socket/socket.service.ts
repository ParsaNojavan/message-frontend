import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
    public socket!: Socket;

    constructor() {
        this.socket = io('http://localhost:3010', {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });
    }

    connect(token: string) {
        this.socket.auth = { token };

        if (this.socket.disconnected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
        }
    }

    emit(eventName: string, data: any) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(eventName, data);
        }
    }

    listen<T>(eventName: string): Observable<T> {
        return new Observable((subscriber) => {

            const listener = (data: T) => {
                subscriber.next(data);
            };

            this.socket.on(eventName, listener);

            return () => {
                this.socket.off(eventName, listener);
            };
        });
    }
}
