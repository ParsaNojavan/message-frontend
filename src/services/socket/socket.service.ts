import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket!: Socket;

    connect(token: string) {
        if (!this.socket) {
            this.socket = io('localhost:3010', {
                auth: { token: token },
                autoConnect: true,
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    emit(eventName: string, data: any) {
        if (this.socket) {
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
