import { PingMC } from './src/PingMC.ts'
const pinger = new PingMC('minecraft.nydus.app', 25565)
await pinger.ping()
