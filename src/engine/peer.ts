import Peer, { DataConnection } from 'peerjs';
import { PeerMessage } from '../types';

const ROOM_PREFIX = 'dvs-speedway-v1-';

export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export class SpeedwayPeer {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  public roomCode = '';
  public isHost = false;

  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onMessage?: (msg: PeerMessage) => void;
  public onError?: (err: string) => void;

  public hostRoom(code?: string): Promise<string> {
    this.destroy();
    this.isHost = true;
    const targetCode = (code || generateRoomCode()).toUpperCase();
    this.roomCode = targetCode;

    return new Promise((resolve, reject) => {
      const peer = new Peer(`${ROOM_PREFIX}${targetCode}`, {
        debug: 0,
      });
      this.peer = peer;

      let settled = false;

      peer.on('open', () => {
        if (!settled) {
          settled = true;
          resolve(targetCode);
        }
      });

      peer.on('connection', (connection) => {
        if (this.conn && this.conn.open) {
          connection.close();
          return;
        }
        this.attachConnection(connection);
      });

      peer.on('error', (err) => {
        const msg =
          err.type === 'unavailable-id'
            ? 'That room code is already in use. Trying another!'
            : err.message || 'Connection error. Please try again.';
        if (!settled) {
          settled = true;
          reject(new Error(msg));
        } else {
          this.onError?.(msg);
        }
      });
    });
  }

  public joinRoom(code: string): Promise<void> {
    this.destroy();
    this.isHost = false;
    const cleaned = code.trim().toUpperCase();
    this.roomCode = cleaned;

    return new Promise((resolve, reject) => {
      const peer = new Peer({ debug: 0 });
      this.peer = peer;

      let settled = false;

      const timeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `Could not find room "${cleaned}". Double-check the 4-letter code!`
            )
          );
          this.destroy();
        }
      }, 10000);

      peer.on('open', () => {
        const connection = peer.connect(`${ROOM_PREFIX}${cleaned}`, {
          reliable: true,
        });
        this.attachConnection(connection, () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timeout);
            resolve();
          }
        });
      });

      peer.on('error', (err) => {
        window.clearTimeout(timeout);
        const msg =
          err.type === 'peer-unavailable'
            ? `Room "${cleaned}" not found. Make sure the Host screen is open!`
            : err.message || 'Could not join room.';
        if (!settled) {
          settled = true;
          reject(new Error(msg));
        } else {
          this.onError?.(msg);
        }
      });
    });
  }

  private attachConnection(
    connection: DataConnection,
    onOpenExtra?: () => void
  ) {
    this.conn = connection;

    connection.on('open', () => {
      onOpenExtra?.();
      this.onConnected?.();
    });

    connection.on('data', (data) => {
      if (data && typeof data === 'object' && 'type' in data) {
        this.onMessage?.(data as PeerMessage);
      }
    });

    connection.on('close', () => {
      this.conn = null;
      this.onDisconnected?.();
    });

    connection.on('error', () => {
      this.onError?.('Connection hiccup with the other device.');
    });
  }

  public send(msg: PeerMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  public isConnected(): boolean {
    return Boolean(this.conn && this.conn.open);
  }

  public destroy() {
    try {
      this.conn?.close();
    } catch {
      // ignore
    }
    try {
      this.peer?.destroy();
    } catch {
      // ignore
    }
    this.conn = null;
    this.peer = null;
  }
}
