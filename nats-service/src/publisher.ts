import { connect, StringCodec } from "nats";

let GLOBAL_COUNTER = 0;

async function main() {
    const servers = [{ servers: "localhost:4222" }];
    servers.forEach(async (v) => {
        try {
            const nc = await connect(v);
            console.log(`connected to ${nc.getServer()}`);
            const sc = StringCodec();

            // Create a function that publishes one message
            const publishMessage = (i: number) => {
                console.log(`publishing ${i}`);
                nc.publish("hello", sc.encode(`world ${i}`));
            };

            // Set up an interval to publish messages every second
            const interval = setInterval(() => {
                if (GLOBAL_COUNTER < 100) {
                    publishMessage(GLOBAL_COUNTER++);
                } else {
                    clearInterval(interval); // Stop when we reach 100
                    nc.drain(); // Clean up the connection
                }
            }, 1000); // 1000 ms = 1 second

        } catch (err) {
            console.log(`error connecting to ${JSON.stringify(v)}`);
        }
    });
}

main();