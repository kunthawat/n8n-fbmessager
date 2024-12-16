"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerTrigger = void 0;
class FacebookMessengerTrigger {
    constructor() {
        this.description = {
            displayName: 'Facebook Messenger Trigger',
            name: 'facebookMessengerTrigger',
            icon: 'file:facebook.svg',
            group: ['trigger'],
            version: 1,
            description: 'Starts the workflow when Facebook Messenger events occur',
            defaults: {
                name: 'Facebook Messenger Trigger',
            },
            inputs: [],
            outputs: [{ type: "main" }],
            credentials: [
                {
                    name: 'facebookApi',
                    required: true,
                },
            ],
            webhooks: [
                {
                    name: 'default',
                    httpMethod: 'POST',
                    responseMode: 'onReceived',
                    path: 'webhook',
                },
            ],
            properties: [
                {
                    displayName: 'Events',
                    name: 'events',
                    type: 'multiOptions',
                    options: [
                        {
                            name: 'Message Received',
                            value: 'messages',
                            description: 'Trigger when a new message is received',
                        },
                        {
                            name: 'Message Read',
                            value: 'message_reads',
                            description: 'Trigger when a message is read',
                        },
                        {
                            name: 'Message Delivered',
                            value: 'message_deliveries',
                            description: 'Trigger when a message is delivered',
                        },
                    ],
                    default: ['messages'],
                    required: true,
                },
            ],
        };
    }
    async webhook() {
        const req = this.getRequestObject();
        const headerData = this.getHeaderData();
        const events = this.getNodeParameter('events');
        if (req.method === 'GET') {
            const mode = headerData['hub.mode'];
            const token = headerData['hub.verify_token'];
            const challenge = headerData['hub.challenge'];
            if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
                return {
                    webhookResponse: challenge,
                };
            }
            return {
                webhookResponse: 'Forbidden',
            };
        }
        const body = this.getBodyData();
        if (body.object === 'page') {
            const returnData = [];
            const entries = body.entry;
            for (const entry of entries) {
                const messaging = entry.messaging[0];
                if (messaging.message && events.includes('messages')) {
                    returnData.push({
                        json: {
                            messageId: messaging.message.mid,
                            messageText: messaging.message.text,
                            senderId: messaging.sender.id,
                            recipientId: messaging.recipient.id,
                            timestamp: messaging.timestamp,
                            eventType: 'message_received',
                        },
                    });
                }
            }
            if (returnData.length) {
                return {
                    webhookResponse: { success: true },
                    workflowData: [returnData],
                };
            }
        }
        return {
            webhookResponse: { success: true },
        };
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
