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
            ],
        };
    }
    async webhook() {
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
            // Handle POST requests (incoming messages)
            const bodyData = this.getBodyData();
            n8n_workflow_1.LoggerProxy.debug('Received webhook data:', { bodyData });
            // Validate and transform the data
            const webhookData = bodyData;
            if (!webhookData.field || webhookData.field !== 'messages' || !webhookData.value) {
                n8n_workflow_1.LoggerProxy.debug('Invalid webhook data format or not a message', { webhookData });
                return {
                    webhookResponse: 'OK',
                };
            }
            const value = webhookData.value;
            // Process the message
            const output = {
                senderId: value.sender.id,
                recipientId: value.recipient.id,
                timestamp: value.timestamp,
                messageId: value.message.mid,
                text: value.message.text,
                commands: value.message.commands || [],
                rawData: webhookData,
            };
            n8n_workflow_1.LoggerProxy.debug('Processed message:', { output });
            // Return both webhook response and data for the next node
            return {
                webhookResponse: 'OK',
                workflowData: [this.helpers.returnJsonArray([output])],
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
