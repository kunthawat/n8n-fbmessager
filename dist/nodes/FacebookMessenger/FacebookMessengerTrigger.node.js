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
        var _a, _b;
        try {
            const credentials = await this.getCredentials('facebookMessengerApi');
            const httpMethod = this.getNodeParameter('httpMethod');
            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData();
                if (query['hub.mode'] === 'subscribe' &&
                    query['hub.verify_token'] === credentials.verifyToken) {
                    return {
                        webhookResponse: query['hub.challenge'],
                    };
                }
                return {
                    webhookResponse: 'Verification failed',
                };
            }
            // Handle POST requests
            const bodyData = this.getBodyData();
            const selectedEvents = this.getNodeParameter('events', ['messages']);
            n8n_workflow_1.LoggerProxy.debug('Webhook received data:', {
                bodyData,
                selectedEvents,
            });
            // Process incoming data
            if (bodyData.object === 'page') {
                const entries = bodyData.entry;
                if (!(entries === null || entries === void 0 ? void 0 : entries.length)) {
                    return { webhookResponse: 'OK' };
                }
                const outputs = [];
                for (const entry of entries) {
                    const messaging = entry.messaging;
                    if (!(messaging === null || messaging === void 0 ? void 0 : messaging.length))
                        continue;
                    for (const message of messaging) {
                        n8n_workflow_1.LoggerProxy.debug('Processing message:', { message });
                        // Base output data
                        const baseOutput = {
                            timestamp: entry.time || Date.now(),
                            pageId: entry.id,
                            senderId: (_a = message.sender) === null || _a === void 0 ? void 0 : _a.id,
                            recipientId: (_b = message.recipient) === null || _b === void 0 ? void 0 : _b.id,
                        };
                        // Handle standard message
                        if (message.message && !message.message.is_echo) {
                            const msgData = message.message;
                            if (selectedEvents.includes('messages')) {
                                outputs.push({
                                    ...baseOutput,
                                    eventType: 'messages',
                                    messageId: msgData.mid,
                                    text: msgData.text,
                                    messageData: msgData,
                                    rawData: message,
                                });
                            }
                            continue;
                        }
                        // Handle echo
                        if (message.message && message.message.is_echo) {
                            const msgData = message.message;
                            if (selectedEvents.includes('message_echoes')) {
                                outputs.push({
                                    ...baseOutput,
                                    eventType: 'message_echoes',
                                    messageId: msgData.mid,
                                    text: msgData.text,
                                    isEcho: true,
                                    rawData: message,
                                });
                            }
                            continue;
                        }
                        // Handle delivery
                        if (message.delivery && selectedEvents.includes('message_deliveries')) {
                            outputs.push({
                                ...baseOutput,
                                eventType: 'message_deliveries',
                                delivery: message.delivery,
                                rawData: message,
                            });
                            continue;
                        }
                        // Handle read
                        if (message.read && selectedEvents.includes('message_reads')) {
                            outputs.push({
                                ...baseOutput,
                                eventType: 'message_reads',
                                read: message.read,
                                rawData: message,
                            });
                            continue;
                        }
                    }
                }
                if (outputs.length > 0) {
                    n8n_workflow_1.LoggerProxy.debug('Processed outputs:', { outputs });
                    return {
                        webhookResponse: 'OK',
                        workflowData: [this.helpers.returnJsonArray(outputs)],
                    };
                }
            }
            return {
                webhookResponse: 'OK',
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
