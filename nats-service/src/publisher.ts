import { connect, StringCodec } from "nats";

let GLOBAL_COUNTER = 0;

async function main() {
    const servers = [{ servers: "localhost:4222" }];
    await servers.forEach(async (v) => {
        try {
            const nc = await connect(v);
            console.log(`connected to ${nc.getServer()}`);
            const sc = StringCodec()

            // setTimeout(() => {
            //     console.log(`publishing ${GLOBAL_COUNTER}`);
            //     nc.publish("hello", sc.encode(`world ${GLOBAL_COUNTER++}`));
            // }, 1 * 1000);

            for (let i = 0; i < 100; i++) {
                console.log(`publishing ${i}`);
                nc.publish("hello", sc.encode(`world ${i}`));
            }
            await nc.drain();
        } catch (err) {
            console.log(`error connecting to ${JSON.stringify(v)}`);
        }
    });
}

main()