"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerAction = void 0;
class FacebookMessengerAction {
    constructor() {
        this.description = {
            displayName: 'Facebook Messenger Action',
            name: 'facebookMessengerAction',
            icon: 'file:FacebookMessengerAction.svg',
            group: ['transform'],
            version: 1,
            description: 'Send messages through Facebook Messenger',
            defaults: {
                name: 'Facebook Messenger Action',
            },
            inputs: [{ type: "main" }],
            outputs: [{ type: "main" }],
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
                    description: 'The PSID of the message recipient (Sender ID)',
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
    }
    async execute() {
        var _a, _b, _c, _d;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('facebookApi');
        if (!(credentials === null || credentials === void 0 ? void 0 : credentials.accessToken)) {
            throw new Error('Access Token is required!');
        }
        try {
            for (let i = 0; i < items.length; i++) {
                const operation = this.getNodeParameter('operation', i);
                if (operation === 'sendMessage') {
                    const recipientId = this.getNodeParameter('recipientId', i);
                    const messageText = this.getNodeParameter('messageText', i);
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
                    }
                    catch (error) {
                        console.error('Facebook API Error:', {
                            status: error.statusCode,
                            message: error.message,
                            response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.body,
                        });
                        if ((_b = error.response) === null || _b === void 0 ? void 0 : _b.body) {
                            const errorBody = typeof error.response.body === 'string'
                                ? JSON.parse(error.response.body)
                                : error.response.body;
                            throw new Error(`Facebook API Error (${error.statusCode}): ${((_c = errorBody.error) === null || _c === void 0 ? void 0 : _c.message) || error.message}`);
                        }
                        throw error;
                    }
                }
            }
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        success: false,
                        error: error.message,
                        details: ((_d = error.response) === null || _d === void 0 ? void 0 : _d.body) || {},
                    },
                });
            }
            else {
                throw error;
            }
        }
        return [returnData];
    }
}
exports.FacebookMessengerAction = FacebookMessengerAction;
//# sourceMappingURL=FacebookMessengerAction.node.js.map