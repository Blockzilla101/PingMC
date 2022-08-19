import * as varint from 'https://deno.land/x/varint@v2.0.0/varint.ts';
import { ByteSet } from 'https://deno.land/x/bytes@1.0.3/mod.ts';
import { IDecodedPacket, IPacket } from './interfaces/mod.ts';
import { Result } from './Result.ts';
import { PacketManager } from './PacketManager.ts';

export class PacketDecoder {
    private _writable: WritableStream<Uint8Array>;
    private finishResolve: (() => void) | null = null;
    private finished = false;

    public pingPacket!: IDecodedPacket<1>;
    public handShakePacket!: IDecodedPacket<0>;

    constructor(conn: Deno.TcpConn, manager: PacketManager) {
        let bytes = new ByteSet(1000, 'big');
        this._writable = new WritableStream<Uint8Array>({
            write: async (chunk) => {
                // resize buffer
                if (bytes.position + chunk.length > bytes.length) {
                    const temp = bytes.buffer.slice(0, bytes.position);
                    bytes = new ByteSet((2 * temp.byteLength) + chunk.byteLength, 'big');
                    bytes.write.uint8Array(temp);
                }

                bytes.write.uint8Array(chunk);

                try {
                    const decodedPacket = this.decodeRawPacket(bytes.buffer.slice(0, bytes.position));

                    if (decodedPacket.id === 0) {
                        this.handShakePacket = this.decodeHandshake(decodedPacket);
                        bytes.position = 0;
                    } else if (decodedPacket.id === 1) {
                        this.pingPacket = this.decodePong(decodedPacket);
                        bytes.position = 0;

                        if (this.finishResolve != null) {
                            this.finishResolve();
                            this.finished = true;
                        }
                    }

                    // send the ping packet once handshake is received
                    if (this.handShakePacket != null) {
                        await conn.write(manager.createPingPacket(Date.now()));
                    }
                } catch (_e) {
                    // ignore incomplete packet errors
                    console.debug(_e)
                }
            },
        });
    }

    decodeRawPacket(rawData: Uint8Array): IPacket {
        const packetLength = varint.decode32(rawData, 0);

        if (rawData.length < packetLength[0] + packetLength[1]) {
            throw new Error('packet is not complete');
        }

        const packetId = varint.decode32(rawData, packetLength[1]);
        const data = rawData.slice(packetId[1]);

        return {
            id: packetId[0],
            bytes: data,
        };
    }

    decodePong(packet: IPacket): IDecodedPacket<1> {
        const hex: string[] = [];
        packet.bytes.forEach((byte) => hex.push(byte.toString(16)));

        (packet as IDecodedPacket<1>).result = Date.now() - 0;

        return packet as IDecodedPacket<1>;
    }

    decodeHandshake(packet: IPacket): IDecodedPacket<0> {
        const responseLength = varint.decode32(packet.bytes, 0);
        const decodedStr = new TextDecoder().decode(packet.bytes.slice(responseLength[1]));
        if (responseLength[0] !== decodedStr.length) throw new Error('packet response field is not complete');

        const response = JSON.parse(decodedStr);

        return {
            ...packet,
            result: new Result(response).parse(),
        };
    }

    public finish(): Promise<void> {
        return new Promise((resolve) => {
            if (this.finished) return resolve();
            this.finishResolve = resolve;
        });
    }

    get writeable() {
        return this._writable;
    }
}
