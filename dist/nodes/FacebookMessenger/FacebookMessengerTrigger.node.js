"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerTrigger = void 0;
class FacebookMessengerTrigger {
    constructor() {
        this.description = {
            displayName: 'Facebook Messenger Trigger',
            name: 'facebookMessengerTrigger',
            icon: 'file:messenger.svg',
            group: ['trigger'],
            version: 1,
            description: 'Starts the workflow when Facebook Messenger events occur',
            defaults: {
                name: 'Facebook Messenger Trigger',
            },
            inputs: [],
            outputs: [{
                    type: "main" /* NodeConnectionType.Main */,
                }],
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
                            description: 'Triggered when a message is received',
                        },
                        {
                            name: 'Message Echo',
                            value: 'message_echoes',
                            description: 'Triggered when a message is sent by your page',
                        },
                        {
                            name: 'Message Delivered',
                            value: 'message_deliveries',
                            description: 'Triggered when a message is delivered',
                        },
                        {
                            name: 'Message Read',
                            value: 'message_reads',
                            description: 'Triggered when a message is read by the recipient',
                        },
                    ],
                    default: ['messages'],
                    required: true,
                },
            ],
        };
    }
    async webhookVerify() {
        const query = this.getQueryData();
        if (query['hub.mode'] === 'subscribe') {
            const credentials = await this.getCredentials('facebookMessengerApi');
            if (query['hub.verify_token'] === credentials.verifyToken) {
                return {
                    webhookResponse: query['hub.challenge'],
                };
            }
        }
        return {
            webhookResponse: 'Verification failed',
        };
    }
    async webhook() {
        var _a, _b;
        const bodyData = this.getBodyData();
        const events = this.getNodeParameter('events');
        const returnData = [];
        if (bodyData.object === 'page') {
            const entries = bodyData.entry;
            if (entries) {
                for (const entry of entries) {
                    const messaging = entry.messaging;
                    if (messaging) {
                        for (const message of messaging) {
                            let eventType = '';
                            if (message.message && !message.message.is_echo) {
                                eventType = 'messages';
                            }
                            else if (message.message && message.message.is_echo) {
                                eventType = 'message_echoes';
                            }
                            else if (message.delivery) {
                                eventType = 'message_deliveries';
                            }
                            else if (message.read) {
                                eventType = 'message_reads';
                            }
                            if (events.includes(eventType)) {
                                returnData.push({
                                    timestamp: entry.time || Date.now(),
                                    pageId: entry.id,
                                    senderId: (_a = message.sender) === null || _a === void 0 ? void 0 : _a.id,
                                    recipientId: (_b = message.recipient) === null || _b === void 0 ? void 0 : _b.id,
                                    eventType,
                                    messageData: message,
                                });
                            }
                        }
                    }
                }
            }
        }
        if (returnData.length === 0) {
            return {
                webhookResponse: 'OK',
            };
        }
        return {
            workflowData: [this.helpers.returnJsonArray(returnData)],
            webhookResponse: 'OK',
        };
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
