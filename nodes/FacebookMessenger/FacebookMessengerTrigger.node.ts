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
    
            // Handle POST requests from Facebook
            const bodyData = this.getBodyData() as IDataObject;
            const selectedEvents = this.getNodeParameter('events', ['messages']) as string[];
            
            LoggerProxy.debug('Facebook Webhook received:', { bodyData });
    
            if (bodyData.object === 'page') {
                const entries = bodyData.entry as IDataObject[];
                if (!entries?.length) {
                    return { webhookResponse: 'OK' };
                }
    
                const outputs: IDataObject[] = [];
    
                for (const entry of entries) {
                    const messaging = entry.messaging as IDataObject[];
                    if (!messaging?.length) continue;
    
                    for (const messageEvent of messaging) {
                        LoggerProxy.debug('Processing message event:', { messageEvent });
    
                        const baseOutput = {
                            timestamp: entry.time || Date.now(),
                            pageId: entry.id,
                            senderId: (messageEvent.sender as IDataObject)?.id,
                            recipientId: (messageEvent.recipient as IDataObject)?.id,
                        };
    
                        // Determine event type and create output
                        if (messageEvent.message) {
                            const msgData = messageEvent.message as IDataObject;
                            
                            // Check for echo messages
                            if (msgData.is_echo) {
                                if (selectedEvents.includes('message_echoes')) {
                                    outputs.push({
                                        ...baseOutput,
                                        eventType: 'message_echoes',
                                        messageId: msgData.mid,
                                        text: msgData.text,
                                        isEcho: true,
                                        metadata: msgData.metadata,
                                        appId: msgData.app_id,
                                        rawData: messageEvent,
                                    });
                                }
                            } 
                            // Handle received messages
                            else if (selectedEvents.includes('messages')) {
                                outputs.push({
                                    ...baseOutput,
                                    eventType: 'messages',
                                    messageId: msgData.mid,
                                    text: msgData.text,
                                    attachments: msgData.attachments,
                                    quickReply: msgData.quick_reply,
                                    nlp: msgData.nlp,
                                    rawData: messageEvent,
                                });
                            }
                        }
                        // Handle delivery reports
                        else if (messageEvent.delivery && selectedEvents.includes('message_deliveries')) {
                            outputs.push({
                                ...baseOutput,
                                eventType: 'message_deliveries',
                                mids: (messageEvent.delivery as IDataObject).mids,
                                watermark: (messageEvent.delivery as IDataObject).watermark,
                                rawData: messageEvent,
                            });
                        }
                        // Handle read reports
                        else if (messageEvent.read && selectedEvents.includes('message_reads')) {
                            outputs.push({
                                ...baseOutput,
                                eventType: 'message_reads',
                                watermark: (messageEvent.read as IDataObject).watermark,
                                rawData: messageEvent,
                            });
                        }
                    }
                }
    
                if (outputs.length > 0) {
                    LoggerProxy.debug('Processed webhook data:', { outputs });
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
                webhookResponse: 'OK', // Always return OK to Facebook
            };
        }
    }
    
}
