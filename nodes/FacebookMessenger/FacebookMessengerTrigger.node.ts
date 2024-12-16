import {
    IHookFunctions,
    IWebhookFunctions,
    IDataObject,
    INodeType,
    INodeTypeDescription,
    IWebhookResponseData,
    NodeConnectionType,
    LoggerProxy,
} from 'n8n-workflow';

interface IFacebookCredentials {
    pageId: string;
    accessToken: string;
    verifyToken: string;
}

export class FacebookMessengerTrigger implements INodeType {
    description: INodeTypeDescription = {
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
            type: NodeConnectionType.Main,
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
                responseMode: 'lastNode', // Changed to lastNode to process data
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

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        try {
            const credentials = await this.getCredentials('facebookMessengerApi') as IFacebookCredentials;
            const httpMethod = this.getNodeParameter('httpMethod') as string;

            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData() as IDataObject;
                if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === credentials.verifyToken) {
                    return {
                        webhookResponse: query['hub.challenge'] as string,
                    };
                }
                return {
                    webhookResponse: 'Verification failed',
                };
            }

            // Handle POST requests (incoming messages)
            const body = this.getBodyData() as IDataObject;
            
            // Ensure it's a page webhook event
            if (body.object !== 'page') {
                return {
                    webhookResponse: 'OK',
                };
            }

            const entries = body.entry as IDataObject[];
            if (!entries?.length) {
                return {
                    webhookResponse: 'OK',
                };
            }

            const selectedEvents = this.getNodeParameter('events', ['messages']) as string[];
            const output: IDataObject[] = [];

            // Process each entry
            for (const entry of entries) {
                const messaging = entry.messaging as IDataObject[];
                if (!messaging?.length) continue;

                for (const message of messaging) {
                    let eventType = '';
                    let messageData: IDataObject = {};

                    if (message.message) {
                        const msg = message.message as IDataObject;
                        eventType = msg.is_echo ? 'message_echoes' : 'messages';
                        messageData = {
                            type: eventType,
                            text: msg.text || '',
                            ...msg,
                        };
                    } else if (message.delivery) {
                        eventType = 'message_deliveries';
                        messageData = {
                            type: eventType,
                            delivery: message.delivery,
                        };
                    } else if (message.read) {
                        eventType = 'message_reads';
                        messageData = {
                            type: eventType,
                            read: message.read,
                        };
                    }

                    if (selectedEvents.includes(eventType)) {
                        output.push({
                            messageId: (message.message as IDataObject)?.mid || undefined,
                            timestamp: entry.time || Date.now(),
                            pageId: entry.id,
                            senderId: (message.sender as IDataObject)?.id,
                            recipientId: (message.recipient as IDataObject)?.id,
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

        } catch (error) {
            LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK',
            };
        }
    }
}
