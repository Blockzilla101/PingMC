// deno run --allow-net example.ts

import { PingMC } from "./mod.ts";

new PingMC("minecraft.nydus.app", 25565)
    .ping()
    .then((data) => console.log(data))
    .catch((error) => console.log(error))
