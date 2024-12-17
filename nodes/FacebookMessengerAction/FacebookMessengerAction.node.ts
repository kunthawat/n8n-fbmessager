import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeConnectionType,
} from 'n8n-workflow';

export class FacebookMessengerAction implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Facebook Messenger Action',
        name: 'facebookMessengerAction',
        icon: 'file:facebook.svg',
        group: ['transform'],
        version: 1,
        description: 'Send messages through Facebook Messenger',
        defaults: {
            name: 'Facebook Messenger Action',
        },
        inputs: [{ type: NodeConnectionType.Main }],
        outputs: [{ type: NodeConnectionType.Main }],
        credentials: [
            {
                name: 'facebookApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Send Message',
                        value: 'sendMessage',
                        description: 'Send a message',
                        action: 'Send a message',
                    },
                ],
                default: 'sendMessage',
            },
            {
                displayName: 'Recipient ID',
                name: 'recipientId',
                type: 'string',
                default: '',
                required: true,
                description: 'The PSID of the message recipient',
                displayOptions: {
                    show: {
                        operation: ['sendMessage'],
                    },
                },
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                default: '',
                required: true,
                description: 'The text to send',
                displayOptions: {
                    show: {
                        operation: ['sendMessage'],
                    },
                },
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        const credentials = await this.getCredentials('facebookApi');

        if (!credentials?.accessToken) {
            throw new Error('Access Token is required!');
        }

        try {
            for (let i = 0; i < items.length; i++) {
                const operation = this.getNodeParameter('operation', i) as string;

                if (operation === 'sendMessage') {
                    const recipientId = this.getNodeParameter('recipientId', i) as string;
                    const messageText = this.getNodeParameter('messageText', i) as string;

                    // Input validation
                    if (!recipientId) {
                        throw new Error('Recipient ID is required!');
                    }
                    if (!messageText) {
                        throw new Error('Message text is required!');
                    }

                    const requestBody = {
                        recipient: {
                            id: recipientId,
                        },
                        message: {
                            text: messageText,
                        },
                        messaging_type: 'RESPONSE',
                    };

                    // Debug logging
                    console.log('Facebook Messenger Request:', {
                        url: 'https://graph.facebook.com/v17.0/me/messages',
                        method: 'POST',
                        recipientId,
                        messageLength: messageText.length,
                        accessToken: `${String(credentials.accessToken).substring(0, 5)}...`,
                    });

                    try {
                        const response = await this.helpers.request({
                            method: 'POST',
                            url: 'https://graph.facebook.com/v17.0/me/messages',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            qs: {
                                access_token: credentials.accessToken,
                            },
                            body: requestBody,
                            resolveWithFullResponse: true,
                        });

                        returnData.push({
                            json: {
                                success: true,
                                ...response,
                            },
                        });
                    } catch (error) {
                        console.error('Facebook API Error:', {
                            status: error.statusCode,
                            message: error.message,
                            response: error.response?.body,
                        });

                        if (error.response?.body) {
                            const errorBody = typeof error.response.body === 'string' 
                                ? JSON.parse(error.response.body) 
                                : error.response.body;

                            throw new Error(
                                `Facebook API Error (${error.statusCode}): ${
                                    errorBody.error?.message || error.message
                                }`
                            );
                        }
                        throw error;
                    }
                }
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        success: false,
                        error: error.message,
                        details: error.response?.body || {},
                    },
                });
            } else {
                throw error;
            }
        }

        return [returnData];
    }
}
