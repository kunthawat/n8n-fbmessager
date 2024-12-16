import {
    IHookFunctions,
    IWebhookFunctions,
    IDataObject,
    INodeType,
    INodeTypeDescription,
    IWebhookResponseData,
    NodeConnectionType,
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

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        try {
            const credentials = await this.getCredentials('facebookMessengerApi') as IFacebookCredentials;
            
            if (!credentials?.verifyToken) {
                throw new Error('No credentials were provided!');
            }

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
            const bodyData = this.getBodyData() as IDataObject;

            // Verify that this is a page subscription
            if (bodyData.object !== 'page') {
                return {
                    webhookResponse: 'Not a page subscription',
                };
            }

            const events = this.getNodeParameter('events', []) as string[];
            const returnData: IDataObject[] = [];

            const entries = bodyData.entry as IDataObject[];
            if (entries?.length) {
                for (const entry of entries) {
                    const messaging = entry.messaging as IDataObject[];
                    if (messaging?.length) {
                        for (const message of messaging) {
                            let eventType = '';
                            if (message.message && !(message.message as IDataObject).is_echo) {
                                eventType = 'messages';
                            } else if (message.message && (message.message as IDataObject).is_echo) {
                                eventType = 'message_echoes';
                            } else if (message.delivery) {
                                eventType = 'message_deliveries';
                            } else if (message.read) {
                                eventType = 'message_reads';
                            }

                            if (events.includes(eventType)) {
                                returnData.push({
                                    timestamp: entry.time || Date.now(),
                                    pageId: entry.id,
                                    senderId: (message.sender as IDataObject)?.id,
                                    recipientId: (message.recipient as IDataObject)?.id,
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

        } catch (error) {
            console.error('Error in Facebook Messenger Trigger:', error);
            return {
                webhookResponse: 'Error processing webhook',
            };
        }
    }
}
