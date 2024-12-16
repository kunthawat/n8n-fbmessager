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

            // Handle POST requests - pass through all data
            const bodyData = this.getBodyData();
            LoggerProxy.debug('Received webhook data:', { bodyData });

            // Return the complete data without processing
            return {
                webhookResponse: 'OK',
                workflowData: [this.helpers.returnJsonArray([{ data: bodyData }])],
            };

        } catch (error) {
            LoggerProxy.error('Facebook Messenger Trigger: Error occurred', { error });
            return {
                webhookResponse: 'OK',
            };
        }
    }
}
