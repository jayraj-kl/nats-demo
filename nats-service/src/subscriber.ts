// import { connect, StringCodec } from "nats";

// async function main() {
//     const nc = await connect({ servers: "localhost:4222" });
//     console.log(`connected to ${nc.getServer()}`);
//     const sc = StringCodec();
//     const sub = nc.subscribe("hello");
//     (async () => {
//         for await (const m of sub) {
//             console.log(`[${sub.getProcessed()}]: ${sc.decode(m.data)}`);
//         }
//         console.log("subscription closed");
//     })();

//     // await nc.drain();
// }

// main()