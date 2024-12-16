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
            credentials: [
                {
                    name: 'facebookMessengerApi',
                    required: true,
                },
            ],
            webhooks: [
                {
                    name: 'default',
                    httpMethod: '={{$parameter["httpMethod"]}}',
                    responseMode: 'onReceived',
                    path: 'webhook',
                },
            ],
            properties: [
                {
                    displayName: 'HTTP Method',
                    name: 'httpMethod',
                    type: 'options',
                    options: [
                        {
                            name: 'GET',
                            value: 'GET',
                        },
                        {
                            name: 'POST',
                            value: 'POST',
                        },
                    ],
                    default: 'POST',
                    description: 'The HTTP method to listen to',
                },
                {
                    displayName: 'Events',
                    name: 'events',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            httpMethod: ['POST'],
                        },
                    },
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
    async webhook() {
        var _a, _b;
        try {
            const credentials = await this.getCredentials('facebookMessengerApi');
            if (!(credentials === null || credentials === void 0 ? void 0 : credentials.verifyToken)) {
                throw new Error('No credentials were provided!');
            }
            const httpMethod = this.getNodeParameter('httpMethod');
            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData();
                if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === credentials.verifyToken) {
                    return {
                        webhookResponse: query['hub.challenge'],
                    };
                }
                return {
                    webhookResponse: 'Verification failed',
                };
            }
            // Handle POST requests (incoming messages)
            const bodyData = this.getBodyData();
            // Verify that this is a page subscription
            if (bodyData.object !== 'page') {
                return {
                    webhookResponse: 'Not a page subscription',
                };
            }
            const events = this.getNodeParameter('events', []);
            const returnData = [];
            const entries = bodyData.entry;
            if (entries === null || entries === void 0 ? void 0 : entries.length) {
                for (const entry of entries) {
                    const messaging = entry.messaging;
                    if (messaging === null || messaging === void 0 ? void 0 : messaging.length) {
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
        catch (error) {
            console.error('Error in Facebook Messenger Trigger:', error);
            return {
                webhookResponse: 'Error processing webhook',
            };
        }
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
