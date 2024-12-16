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
            const httpMethod = this.getNodeParameter('httpMethod');
            // Debug logging
            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Received webhook call', { httpMethod });
            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData();
                n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Handling GET request', { query });
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
            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Received POST data', { bodyData });
            // Early return if not a page subscription
            if (bodyData.object !== 'page') {
                n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Not a page subscription', { object: bodyData.object });
                return {
                    webhookResponse: 'OK',
                };
            }
            const selectedEvents = this.getNodeParameter('events', []);
            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Selected events', { selectedEvents });
            const returnData = [];
            const entries = bodyData.entry;
            if (entries === null || entries === void 0 ? void 0 : entries.length) {
                for (const entry of entries) {
                    n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Processing entry', { entry });
                    // Verify if this message is for our page
                    if (entry.id !== credentials.pageId) {
                        n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Skipping entry - wrong page ID', {
                            received: entry.id,
                            expected: credentials.pageId,
                        });
                        continue;
                    }
                    const messaging = entry.messaging;
                    if (messaging === null || messaging === void 0 ? void 0 : messaging.length) {
                        for (const message of messaging) {
                            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Processing message', { message });
                            let eventType = '';
                            // Determine event type
                            if (message.message) {
                                const messageData = message.message;
                                eventType = messageData.is_echo ? 'message_echoes' : 'messages';
                            }
                            else if (message.delivery) {
                                eventType = 'message_deliveries';
                            }
                            else if (message.read) {
                                eventType = 'message_reads';
                            }
                            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Determined event type', {
                                eventType,
                                isSelected: selectedEvents.includes(eventType)
                            });
                            if (selectedEvents.includes(eventType)) {
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
            n8n_workflow_1.LoggerProxy.debug('Facebook Messenger Trigger: Processing complete', {
                returnDataLength: returnData.length
            });
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
            n8n_workflow_1.LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK', // Always return OK to Facebook
            };
        }
    }
}
exports.FacebookMessengerTrigger = FacebookMessengerTrigger;
