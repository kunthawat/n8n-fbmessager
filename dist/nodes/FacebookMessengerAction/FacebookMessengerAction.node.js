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
                    default: '={{$json["senderId"]}}',
                    required: true,
                    description: 'The ID of the message recipient (Sender ID from the trigger node)',
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
                {
                    displayName: 'Media Type',
                    name: 'mediaType',
                    type: 'options',
                    displayOptions: {
                        show: {
                            operation: ['sendMedia'],
                        },
                    },
                    options: [
                        {
                            name: 'Image',
                            value: 'image',
                        },
                        {
                            name: 'Video',
                            value: 'video',
                        },
                        {
                            name: 'File',
                            value: 'file',
                        },
                    ],
                    default: 'image',
                    description: 'The type of media to send',
                },
                {
                    displayName: 'Media URL',
                    name: 'mediaUrl',
                    type: 'string',
                    displayOptions: {
                        show: {
                            operation: ['sendMedia'],
                        },
                    },
                    default: '={{$json["url"]}}',
                    required: true,
                    description: 'The URL of the media file to send (must be publicly accessible)',
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('facebookApi');
        const operation = this.getNodeParameter('operation', 0);
        try {
            for (let i = 0; i < items.length; i++) {
                const recipientId = this.getNodeParameter('recipientId', i);
                const cleanRecipientId = recipientId.trim().replace(/['"]/g, '');
                const messageData = {
                    messaging_type: 'RESPONSE',
                    recipient: {
                        id: cleanRecipientId,
                    },
                    message: {},
                };
                if (operation === 'sendMessage') {
                    const messageText = this.getNodeParameter('messageText', i);
                    messageData.message = {
                        text: messageText,
                    };
                }
                else if (operation === 'sendMedia') {
                    const mediaType = this.getNodeParameter('mediaType', i);
                    const mediaUrl = this.getNodeParameter('mediaUrl', i);
                    messageData.message = {
                        attachment: {
                            type: mediaType,
                            payload: {
                                url: mediaUrl,
                                is_reusable: true,
                            },
                        },
                    };
                }
                try {
                    const response = await this.helpers.httpRequest({
                        method: 'POST',
                        url: 'https://graph.facebook.com/v17.0/me/messages',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        qs: {
                            access_token: credentials.accessToken,
                        },
                        body: messageData,
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
                        statusCode: error.statusCode,
                        message: error.message,
                        recipientId: cleanRecipientId,
                        response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.body,
                    });
                    if ((_b = error.response) === null || _b === void 0 ? void 0 : _b.body) {
                        const errorBody = typeof error.response.body === 'string'
                            ? JSON.parse(error.response.body)
                            : error.response.body;
                        throw new Error(`Facebook API Error: ${((_c = errorBody.error) === null || _c === void 0 ? void 0 : _c.message) || error.message}`);
                    }
                    throw error;
                }
            }
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        success: false,
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