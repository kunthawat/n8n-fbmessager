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

            // Handle POST requests (incoming messages)
            const bodyData = this.getBodyData();
            LoggerProxy.debug('Received webhook data:', { bodyData });

            // Validate and transform the data
            const webhookData = bodyData as IFacebookWebhookData;
            
            if (!webhookData.field || webhookData.field !== 'messages' || !webhookData.value) {
                LoggerProxy.debug('Invalid webhook data format or not a message', { webhookData });
                return {
                    webhookResponse: 'OK',
                };
            }

            const value = webhookData.value;

            // Process the message
            const output: IDataObject = {
                senderId: value.sender.id,
                recipientId: value.recipient.id,
                timestamp: value.timestamp,
                messageId: value.message.mid,
                text: value.message.text,
                commands: value.message.commands || [],
                rawData: webhookData,
            };

            LoggerProxy.debug('Processed message:', { output });

            // Return both webhook response and data for the next node
            return {
                webhookResponse: 'OK',
                workflowData: [this.helpers.returnJsonArray([output])],
            };

        } catch (error) {
            LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK',
            };
        }
    }
}
