"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessenger = void 0;
class FacebookMessenger {
    constructor() {
        this.description = {
            displayName: 'Facebook Messenger',
            name: 'facebookMessenger',
            icon: 'file:messenger.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Send messages through Facebook Messenger',
            defaults: {
                name: 'Facebook Messenger',
            },
            // Using NodeConnectionType.Main for inputs/outputs
            inputs: [{
                    type: "main" /* NodeConnectionType.Main */,
                }],
            outputs: [{
                    type: "main" /* NodeConnectionType.Main */,
                }],
            credentials: [
                {
                    name: 'facebookMessengerApi',
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
                            description: 'Send a message to a user',
                            action: 'Send a message',
                        },
                    ],
                    default: 'sendMessage',
                },
                {
                    displayName: 'Recipient ID',
                    name: 'recipientId',
                    type: 'string',
                    required: true,
                    default: '',
                    description: 'PSID of the message recipient',
                },
                {
                    displayName: 'Message Type',
                    name: 'messageType',
                    type: 'options',
                    options: [
                        {
                            name: 'Text',
                            value: 'text',
                        },
                        {
                            name: 'Media',
                            value: 'media',
                        },
                    ],
                    default: 'text',
                    description: 'Type of message to send',
                },
                {
                    displayName: 'Message Text',
                    name: 'messageText',
                    type: 'string',
                    displayOptions: {
                        show: {
                            messageType: ['text'],
                        },
                    },
                    default: '',
                    description: 'Text message to send',
                },
                {
                    displayName: 'Media Type',
                    name: 'mediaType',
                    type: 'options',
                    displayOptions: {
                        show: {
                            messageType: ['media'],
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
                            name: 'Audio',
                            value: 'audio',
                        },
                    ],
                    default: 'image',
                    description: 'Type of media to send',
                },
                {
                    displayName: 'Media URL',
                    name: 'mediaUrl',
                    type: 'string',
                    displayOptions: {
                        show: {
                            messageType: ['media'],
                        },
                    },
                    default: '',
                    description: 'URL of the media to send',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const length = items.length;
        for (let i = 0; i < length; i++) {
            try {
                const credentials = await this.getCredentials('facebookMessengerApi');
                const operation = this.getNodeParameter('operation', i);
                const recipientId = this.getNodeParameter('recipientId', i);
                const messageType = this.getNodeParameter('messageType', i);
                let messageData = {};
                if (messageType === 'text') {
                    const messageText = this.getNodeParameter('messageText', i);
                    messageData = { text: messageText };
                }
                else if (messageType === 'media') {
                    const mediaType = this.getNodeParameter('mediaType', i);
                    const mediaUrl = this.getNodeParameter('mediaUrl', i);
                    messageData = {
                        attachment: {
                            type: mediaType,
                            payload: {
                                url: mediaUrl,
                                is_reusable: true,
                            },
                        },
                    };
                }
                const body = {
                    recipient: { id: recipientId },
                    messaging_type: 'RESPONSE',
                    message: messageData,
                };
                const requestOptions = {
                    method: 'POST',
                    url: `https://graph.facebook.com/v21.0/${credentials.pageId}/messages`,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    qs: {
                        access_token: credentials.accessToken,
                    },
                    body,
                    json: true,
                };
                const response = await this.helpers.request(requestOptions);
                returnData.push({
                    json: response,
                    pairedItem: {
                        item: i,
                    },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.FacebookMessenger = FacebookMessenger;
