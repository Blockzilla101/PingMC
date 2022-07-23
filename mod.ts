import { PingMC } from './src/ping-mc.ts'
const pinger = new PingMC('minecraft.nydus.app', 25565)
await pinger.ping()
