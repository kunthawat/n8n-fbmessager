"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerAction = void 0;
class FacebookMessengerAction {
    constructor() {
        this.description = {
            displayName: 'Facebook Messenger',
            name: 'facebookMessenger',
            icon: 'file:FacebookMessengerAction.svg',
            group: ['transform'],
            version: 1,
            description: 'Send messages through Facebook Messenger',
            defaults: {
                name: 'Facebook Messenger',
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
                        {
                            name: 'Send Template',
                            value: 'sendTemplate',
                            description: 'Send a template message',
                            action: 'Send a template message',
                        },
                        {
                            name: 'Send Media',
                            value: 'sendMedia',
                            description: 'Send media (image, video, file)',
                            action: 'Send media',
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
                    description: 'The ID of the message recipient (Sender ID)',
                },
                {
                    displayName: 'Message Text',
                    name: 'messageText',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            operation: ['sendMessage'],
                        },
                    },
                    required: true,
                    description: 'The text to send',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('facebookApi');
        const operation = this.getNodeParameter('operation', 0);
        try {
            for (let i = 0; i < items.length; i++) {
                const recipientId = this.getNodeParameter('recipientId', i);
                const messageData = {
                    messaging_type: 'RESPONSE',
                    recipient: {
                        id: recipientId,
                    },
                    message: {},
                };
                if (operation === 'sendMessage') {
                    const messageText = this.getNodeParameter('messageText', i);
                    messageData.message = {
                        text: messageText,
                    };
                }
                const response = await this.helpers.httpRequest({
                    method: 'POST',
                    url: 'https://graph.facebook.com/v13.0/me/messages',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    qs: {
                        access_token: credentials.accessToken,
                    },
                    body: messageData,
                });
                returnData.push({
                    json: response,
                });
            }
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        error: error.message,
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