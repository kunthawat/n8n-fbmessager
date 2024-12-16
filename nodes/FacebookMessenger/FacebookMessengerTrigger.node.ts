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

// Interfaces for specific message format
interface IFacebookMessage {
    mid: string;
    text: string;
    commands?: Array<{ name: string }>;
    is_echo?: boolean;
}

interface IFacebookSender {
    id: string;
}

interface IFacebookRecipient {
    id: string;
}

interface IFacebookMessageValue {
    sender: IFacebookSender;
    recipient: IFacebookRecipient;
    timestamp: string;
    message: IFacebookMessage;
}

interface IFacebookWebhookData extends IDataObject {
    field: string;
    value: IFacebookMessageValue;
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

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        try {
            const credentials = await this.getCredentials('facebookMessengerApi');
            const httpMethod = this.getNodeParameter('httpMethod') as string;

            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData() as IDataObject;
                if (query['hub.mode'] === 'subscribe' && 
                    query['hub.verify_token'] === credentials.verifyToken) {
                    return {
                        webhookResponse: query['hub.challenge'] as string,
                    };
                }
                return {
                    webhookResponse: 'Verification failed',
                };
            }

            // Handle POST requests
            const bodyData = this.getBodyData();
            const selectedEvents = this.getNodeParameter('events', ['messages']) as string[];
            LoggerProxy.debug('Received webhook data:', { bodyData, selectedEvents });

            // Handle the specific message format
            if (bodyData.field === 'messages' && bodyData.value) {
                const webhookData = bodyData as IFacebookWebhookData;
                const value = webhookData.value;

                const output: IDataObject = {
                    senderId: value.sender.id,
                    recipientId: value.recipient.id,
                    timestamp: value.timestamp,
                    messageId: value.message.mid,
                    text: value.message.text,
                    commands: value.message.commands || [],
                    eventType: 'messages',
                    rawData: webhookData,
                };

                return {
                    webhookResponse: 'OK',
                    workflowData: [this.helpers.returnJsonArray([output])],
                };
            }

            // Handle standard Facebook webhook format
            const body = bodyData as IDataObject;
            
            if (body.object === 'page') {
                const entries = body.entry as IDataObject[];
                if (!entries?.length) {
                    return { webhookResponse: 'OK' };
                }

                const outputs: IDataObject[] = [];

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
                            outputs.push({
                                messageId: (message.message as IDataObject)?.mid,
                                timestamp: entry.time || Date.now(),
                                pageId: entry.id,
                                senderId: (message.sender as IDataObject)?.id,
                                recipientId: (message.recipient as IDataObject)?.id,
                                eventType,
                                messageData,
                                rawData: message,
                            });
                        }
                    }
                }

                if (outputs.length > 0) {
                    return {
                        webhookResponse: 'OK',
                        workflowData: [this.helpers.returnJsonArray(outputs)],
                    };
                }
            }

            return {
                webhookResponse: 'OK',
            };

        } catch (error) {
            LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK',
            };
        }
    }
}
