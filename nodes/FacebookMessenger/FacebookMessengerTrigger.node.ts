import {
    IHookFunctions,
    IWebhookFunctions,
    IDataObject,
    INodeType,
    INodeTypeDescription,
    IWebhookResponseData,
    NodeConnectionType,
} from 'n8n-workflow';

interface IFacebookMessage extends IDataObject {
    message?: {
        is_echo?: boolean;
        text?: string;
    };
    sender?: {
        id: string;
    };
    recipient?: {
        id: string;
    };
    delivery?: IDataObject;
    read?: IDataObject;
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
                        description: 'Use GET for webhook verification',
                    },
                    {
                        name: 'POST',
                        value: 'POST',
                        description: 'Use POST for receiving messages',
                    },
                ],
                default: 'POST',
                description: 'The HTTP method to listen to',
                required: true,
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

    async webhookVerify(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const httpMethod = this.getNodeParameter('httpMethod') as string;
        
        if (httpMethod === 'GET') {
            const query = this.getQueryData() as IDataObject;

            if (query['hub.mode'] === 'subscribe') {
                const credentials = await this.getCredentials('facebookMessengerApi') as {
                    verifyToken: string;
                };

                if (query['hub.verify_token'] === credentials.verifyToken) {
                    return {
                        webhookResponse: query['hub.challenge'] as string,
                    };
                }
            }

            return {
                webhookResponse: 'Verification failed',
            };
        }

        // For POST requests
        const bodyData = this.getBodyData() as IDataObject;
        const events = this.getNodeParameter('events') as string[];
        const returnData: IDataObject[] = [];

        if (bodyData.object === 'page') {
            const entries = bodyData.entry as IDataObject[];
            
            if (entries) {
                for (const entry of entries) {
                    const messaging = entry.messaging as IFacebookMessage[];
                    if (messaging) {
                        for (const message of messaging) {
                            let eventType = '';
                            if (message.message && !message.message.is_echo) {
                                eventType = 'messages';
                            } else if (message.message && message.message.is_echo) {
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
                                    senderId: message.sender?.id,
                                    recipientId: message.recipient?.id,
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
