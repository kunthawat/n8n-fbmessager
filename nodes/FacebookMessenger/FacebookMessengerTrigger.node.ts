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
            const httpMethod = this.getNodeParameter('httpMethod') as string;

            // Debug logging
            LoggerProxy.debug('Facebook Messenger Trigger: Received webhook call', { httpMethod });

            // Handle GET requests (webhook verification)
            if (httpMethod === 'GET') {
                const query = this.getQueryData() as IDataObject;
                LoggerProxy.debug('Facebook Messenger Trigger: Handling GET request', { query });

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
            LoggerProxy.debug('Facebook Messenger Trigger: Received POST data', { bodyData });

            // Early return if not a page subscription
            if (bodyData.object !== 'page') {
                LoggerProxy.debug('Facebook Messenger Trigger: Not a page subscription', { object: bodyData.object });
                return {
                    webhookResponse: 'OK',
                };
            }

            const selectedEvents = this.getNodeParameter('events', []) as string[];
            LoggerProxy.debug('Facebook Messenger Trigger: Selected events', { selectedEvents });

            const returnData: IDataObject[] = [];
            const entries = bodyData.entry as IDataObject[];

            if (entries?.length) {
                for (const entry of entries) {
                    LoggerProxy.debug('Facebook Messenger Trigger: Processing entry', { entry });
                    
                    // Verify if this message is for our page
                    if (entry.id !== credentials.pageId) {
                        LoggerProxy.debug('Facebook Messenger Trigger: Skipping entry - wrong page ID', {
                            received: entry.id,
                            expected: credentials.pageId,
                        });
                        continue;
                    }

                    const messaging = entry.messaging as IDataObject[];
                    if (messaging?.length) {
                        for (const message of messaging) {
                            LoggerProxy.debug('Facebook Messenger Trigger: Processing message', { message });

                            let eventType = '';
                            // Determine event type
                            if (message.message) {
                                const messageData = message.message as IDataObject;
                                eventType = messageData.is_echo ? 'message_echoes' : 'messages';
                            } else if (message.delivery) {
                                eventType = 'message_deliveries';
                            } else if (message.read) {
                                eventType = 'message_reads';
                            }

                            LoggerProxy.debug('Facebook Messenger Trigger: Determined event type', { 
                                eventType, 
                                isSelected: selectedEvents.includes(eventType) 
                            });

                            if (selectedEvents.includes(eventType)) {
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

            LoggerProxy.debug('Facebook Messenger Trigger: Processing complete', { 
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

        } catch (error) {
            LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK', // Always return OK to Facebook
            };
        }
    }
}
