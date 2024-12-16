"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
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
                    responseMode: 'lastNode',
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
        var _a, _b, _c;
        try {
            const credentials = await this.getCredentials('facebookMessengerApi');
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
            const body = this.getBodyData();
            // Ensure it's a page webhook event
            if (body.object !== 'page') {
                return {
                    webhookResponse: 'OK',
                };
            }
            const entries = body.entry;
            if (!(entries === null || entries === void 0 ? void 0 : entries.length)) {
                return {
                    webhookResponse: 'OK',
                };
            }
            const selectedEvents = this.getNodeParameter('events', ['messages']);
            const output = [];
            // Process each entry
            for (const entry of entries) {
                const messaging = entry.messaging;
                if (!(messaging === null || messaging === void 0 ? void 0 : messaging.length))
                    continue;
                for (const message of messaging) {
                    let eventType = '';
                    let messageData = {};
                    if (message.message) {
                        const msg = message.message;
                        eventType = msg.is_echo ? 'message_echoes' : 'messages';
                        messageData = {
                            type: eventType,
                            text: msg.text || '',
                            ...msg,
                        };
                    }
                    else if (message.delivery) {
                        eventType = 'message_deliveries';
                        messageData = {
                            type: eventType,
                            delivery: message.delivery,
                        };
                    }
                    else if (message.read) {
                        eventType = 'message_reads';
                        messageData = {
                            type: eventType,
                            read: message.read,
                        };
                    }
                    if (selectedEvents.includes(eventType)) {
                        output.push({
                            messageId: ((_a = message.message) === null || _a === void 0 ? void 0 : _a.mid) || undefined,
                            timestamp: entry.time || Date.now(),
                            pageId: entry.id,
                            senderId: (_b = message.sender) === null || _b === void 0 ? void 0 : _b.id,
                            recipientId: (_c = message.recipient) === null || _c === void 0 ? void 0 : _c.id,
                            eventType,
                            messageData,
                            rawData: message, // Include raw data for complete access
                        });
                    }
                }
            }
            if (output.length === 0) {
                return {
                    webhookResponse: 'OK',
                };
            }
            // Return both webhook response and data for the next node
            return {
                webhookResponse: 'OK',
                workflowData: [this.helpers.returnJsonArray(output)],
            };
        }
        catch (error) {
            n8n_workflow_1.LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK',
            };
        }
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
