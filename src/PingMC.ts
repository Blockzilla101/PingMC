import { PacketDecoder } from './PacketDecoder.ts';
import { PacketManager } from './PacketManager.ts';
import { IResult } from './interfaces/mod.ts';

export class PingMC {
    constructor(private hostname: string, private port: number) {}

    public async ping(): Promise<IResult> {
        const conn = await Deno.connect({ hostname: this.hostname, port: this.port });

        const manager = new PacketManager(this.hostname, this.port);
        const decoder = new PacketDecoder(conn, manager);

        await conn.write(manager.createHandshakePacket());
        await conn.write(manager.createEmptyPacket());

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('connection timed out'));
            }, 5 * 1000);

            conn.readable.pipeTo(decoder.writeable).catch(e => {
                console.error("[mc-ping] piping failed")
                console.error(e)
            });

            await decoder.finish();
            clearTimeout(timeout);

            const result = decoder.handShakePacket.result;
            if (result.ping == null) {
                result.ping = decoder.pingPacket.result;
            }

            resolve(result);            
        })
    }
}
