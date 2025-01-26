import { connect, StringCodec, NatsConnection, Subscription } from "nats";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private subscriptions: Map<string, string[]> = new Map();
    private reverseSubscriptions: Map<string, string[]> = new Map();
    private natsClient: any;
    private sc: any;
    private activeSubscriptions: Map<string, Subscription> = new Map();

    private constructor() {
        // setInterval(() => { this.debug() }, 5 * 1000) 
    }

    debug() {
        console.log("----debug--- Current Subscriptions: -- SubscriptionManager.ts")
        console.log(this.subscriptions);
        console.log(this.reverseSubscriptions);
        console.log(this.natsClient);
        console.log(this.sc);
        console.log(this.activeSubscriptions);
        console.log("----debug--- Current Subscriptions: -- SubscriptionManager.ts")
    }

    public static async getInstance() {
        if (!this.instance) {
            this.instance = new SubscriptionManager();
            await SubscriptionManager.instance.connectToNats();
        }
        return this.instance;
    }

    private async connectToNats(): Promise<void> {
        try {
            this.natsClient = await connect({ servers: "localhost:4222" });
            this.sc = StringCodec();
        } catch (error) {
            console.error("Failed to initialize NATS connection:", error);
            throw error;
        }
    }

    public async subscribe(userId: string, subscription: string) {
        // Check if user is already subscribed to this topic
        if (this.subscriptions.get(userId)?.includes(subscription)) {
            return;
        }

        // Update subscription mappings
        this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
        this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));

        // If this is the first subscriber for this topic, create NATS subscription
        if (this.reverseSubscriptions.get(subscription)?.length === 1) {
            const sub = this.natsClient.subscribe(subscription);
            this.activeSubscriptions.set(subscription, sub);

            (async () => {
                for await (const msg of sub) {
                    try {
                        const message = this.sc.decode(msg.data);
                        // console.log(`Received message for subscription ${subscription}:`, message);
                        
                        let parsedData;
                        try {
                            // console.log("Parsing message as JSON");
                            parsedData = JSON.parse(message);
                        } catch {
                            console.log("Message is not JSON, using as is");
                            parsedData = message;
                        }
            
                        const messageObject = {
                            subscription: subscription,
                            data: parsedData
                        };
            
                        this.reverseSubscriptions.get(subscription)?.forEach(userId => 
                            UserManager.getInstance().getUser(userId)?.emit(messageObject)
                        );
                    } catch (error) {
                        console.error(`Error processing message for subscription ${subscription}:`, error);
                    }
                }
            })();

        }
    }

    public async unsubscribe(userId: string, subscription: string) {
        const subscriptions = this.subscriptions.get(userId);
        if (subscriptions) {
            this.subscriptions.set(userId, subscriptions.filter(s => s !== subscription));
        }

        const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
        if (reverseSubscriptions) {
            this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter(s => s !== userId));

            // If no more subscribers for this topic, unsubscribe from NATS
            if (this.reverseSubscriptions.get(subscription)?.length === 0) {
                this.reverseSubscriptions.delete(subscription);
                const sub = this.activeSubscriptions.get(subscription);
                if (sub) {
                    sub.unsubscribe();
                    this.activeSubscriptions.delete(subscription);
                }
            }
        }
    }

    public userLeft(userId: string) {
        console.log("user left " + userId);
        this.subscriptions.get(userId)?.forEach(s => this.unsubscribe(userId, s));
    }
    
    public getSubscriptions(userId: string) {
        return this.subscriptions.get(userId) || [];
    }

    public async cleanup() {
        if (this.natsClient) {
            await this.natsClient.drain();
            await this.natsClient.close();
        }
    }
}