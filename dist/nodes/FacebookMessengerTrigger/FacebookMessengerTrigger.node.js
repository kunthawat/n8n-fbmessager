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
            subtitle: '={{$parameter["operation"]}}',
            description: 'Handle Facebook Messenger webhook events',
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
                    httpMethod: 'GET',
                    responseMode: 'onReceived',
                    path: 'webhook',
                },
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
                        {
                            name: 'Postback',
                            value: 'messaging_postbacks',
                            description: 'Trigger when a postback is received',
                        },
                    ],
                    default: ['messages'],
                    required: true,
                },
            ],
        };
        this.methods = {
            credentialTest: {
                async facebookApiTest(credential) {
                    const { accessToken } = credential.data;
                    if (!accessToken) {
                        return {
                            status: 'Error',
                            message: 'Access Token is required!',
                        };
                    }
                    const options = {
                        url: `https://graph.facebook.com/v13.0/me`,
                        qs: {
                            access_token: accessToken,
                        },
                        method: 'GET',
                        json: true,
                    };
                    try {
                        await this.helpers.request(options);
                        return {
                            status: 'OK',
                            message: 'Authentication successful!',
                        };
                    }
                    catch (error) {
                        return {
                            status: 'Error',
                            message: error.message,
                        };
                    }
                },
            },
        };
    }
    async webhook() {
        const req = this.getRequestObject();
        const credentials = await this.getCredentials('facebookApi');
        const events = this.getNodeParameter('events');
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.verifyToken)) {
            throw new Error('Verify Token is required!');
        }
        if (req.method === 'GET') {
            const query = this.getQueryData();
            const mode = query['hub.mode'];
            const token = query['hub.verify_token'];
            const challenge = query['hub.challenge'];
            if (mode === 'subscribe' && token === credentials.verifyToken) {
                return {
                    webhookResponse: challenge,
                };
            }
            else {
                return {
                    webhookResponse: 'Forbidden',
                };
            }
        }
        if (req.method === 'POST') {
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
                                rawData: messaging,
                            },
                        });
                    }
                    if (messaging.read && events.includes('message_reads')) {
                        returnData.push({
                            json: {
                                watermark: messaging.read.watermark,
                                senderId: messaging.sender.id,
                                recipientId: messaging.recipient.id,
                                timestamp: messaging.timestamp,
                                eventType: 'message_read',
                                rawData: messaging,
                            },
                        });
                    }
                    if (messaging.delivery && events.includes('message_deliveries')) {
                        returnData.push({
                            json: {
                                watermark: messaging.delivery.watermark,
                                senderId: messaging.sender.id,
                                recipientId: messaging.recipient.id,
                                timestamp: messaging.timestamp,
                                eventType: 'message_delivered',
                                rawData: messaging,
                            },
                        });
                    }
                    if (messaging.postback && events.includes('messaging_postbacks')) {
                        returnData.push({
                            json: {
                                payload: messaging.postback.payload,
                                senderId: messaging.sender.id,
                                recipientId: messaging.recipient.id,
                                timestamp: messaging.timestamp,
                                eventType: 'postback',
                                rawData: messaging,
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
        }
        return {
            webhookResponse: { success: true },
        };
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
//# sourceMappingURL=FacebookMessengerTrigger.node.js.map