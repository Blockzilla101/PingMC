import * as varint from 'https://deno.land/x/varint@v2.0.0/varint.ts';
import { ByteSet } from 'https://deno.land/x/bytes@1.0.3/mod.ts';

export class PacketManager {
    constructor(private hostname: string, private port: number) {}

    public createPacket(packetId: number, data: Uint8Array) {
        const bytes = new ByteSet(data.length + 2, 'big');
        bytes.write.uint8Array(varint.encode(varint.encode(packetId)[0].length + data.length)[0]);
        bytes.write.uint8Array(varint.encode(packetId)[0]);
        bytes.write.uint8Array(data);
        return bytes.buffer;
    }

    public createHandshakePacket() {
        const bytes = new ByteSet(50, 'big');
        bytes.write.uint8Array(varint.encode(4294967295n)[0]);
        bytes.write.uint8Array(varint.encode(this.hostname.length)[0]);
        bytes.write.uint8Array(new TextEncoder().encode(this.hostname));
        bytes.write.int16(this.port);
        bytes.write.uint8Array(varint.encode(1)[0]);
        return this.createPacket(0, bytes.buffer.slice(0, bytes.position));
    }

    public createPingPacket(timestamp: number) {
        const bytes = new ByteSet(8, 'big');
        // fixme: figure how to encode the timestamp properly
        bytes.write.uint32(0);
        bytes.write.uint32(timestamp);
        return this.createPacket(1, bytes.buffer);
    }

    public createEmptyPacket() {
        return this.createPacket(0, new Uint8Array());
    }
}
