import { PacketDecoder } from './PacketDecoder.ts';
import { PacketManager } from './PacketManager.ts';

export class PingMC {
    constructor(private hostname: string, private port: number) {}

    public async ping() {
        const manager = new PacketManager(this.hostname, this.port);
        const decoder = new PacketDecoder();

        const conn = await Deno.connect({ hostname: this.hostname, port: this.port });
        await conn.write(manager.createHandshakePacket());
        await conn.write(manager.createEmptyPacket());
        conn.readable.pipeTo(decoder.writeable);
    }
}
