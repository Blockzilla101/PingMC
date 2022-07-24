import * as varint from 'https://deno.land/x/varint@v2.0.0/varint.ts';
import { ByteSet } from 'https://deno.land/x/bytes@1.0.3/mod.ts';
import { IDecodedPacket, IPacket } from './interfaces/mod.ts';
import { Result } from './Result.ts';

export class PacketDecoder {
    private _writable: WritableStream<Uint8Array>;

    public decodedPackets: any[] = [];

    constructor() {
        const decoder = this;
        let bytes = new ByteSet(1000, 'big');
        this._writable = new WritableStream<Uint8Array>({
            write(chunk) {
                if (bytes.position + chunk.length > bytes.length) {
                    const temp = bytes.buffer.slice(0, bytes.position);
                    bytes = new ByteSet((2 * temp.byteLength) + chunk.byteLength, 'big');
                    bytes.write.uint8Array(temp);
                }
                bytes.write.uint8Array(chunk);
                try {
                    const decodedPacket = decoder.decodeRawPacket(bytes.buffer.slice(0, bytes.position));
                    if (decodedPacket.id === 0) {
                        decoder.decodedPackets.push(decoder.decodeHandshake(decodedPacket));
                    } else {
                        decoder.decodedPackets.push(decoder.decodePong(decodedPacket));
                    }
                    console.log(decoder.decodedPackets);
                } catch (_e) {
                    // ignore incomplete packet errors
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

    decodePong(packet: IPacket) {
        const hex: string[] = [];
        packet.bytes.forEach((byte) => hex.push(byte.toString(16)));

        // fixme: timestamps don't work
        (packet as IDecodedPacket).result = Date.now() - 0;

        return packet as IDecodedPacket;
    }

    decodeHandshake(packet: IPacket) {
        const responseLength = varint.decode32(packet.bytes, 0);
        const decodedStr = new TextDecoder().decode(packet.bytes.slice(responseLength[1]));
        if (responseLength[0] !== decodedStr.length) throw new Error('packet response field is not complete');

        const response = JSON.parse(decodedStr);

        return {
            ...packet,
            result: new Result(response).parse(),
        };
    }

    get writeable() {
        return this._writable;
    }
}
