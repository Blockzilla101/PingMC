import { PackageManager } from './packet-manager.ts';

export class PingMC {
    constructor(private hostname: string, private port: number) {}

    public ping() {
        const manager = new PackageManager(this.hostname, this.port);
        manager.createPingPacket(1658583984384);
        manager.createHandshakePacket();
    }
}
