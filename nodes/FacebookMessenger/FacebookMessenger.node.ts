import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class FacebookMessenger implements INodeType {
	description: INodeTypeDescription = {
		// Basic node information
		displayName: 'Facebook Messenger',
		name: 'facebookMessenger',
		icon: 'file:messenger.svg',
		group: ['communication'],
		version: 1,
		description: 'Send messages through Facebook Messenger',
		defaults: {
			name: 'Facebook Messenger',
		},

		// Define input and output
		inputs: ['main'],
		outputs: ['main'],

		// Credentials
		credentials: [
			{
				name: 'facebookMessengerApi',
				required: true,
			},
		],

		// Properties
		properties: [
			// Operations
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a message to a user',
						action: 'Send a message',
					},
				],
				default: 'send',
			},

			// Fields
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				required: true,
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
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['message'],
					},
				},
				default: 'text',
			},
			{
				displayName: 'Recipient ID',
				name: 'recipientId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['message'],
					},
				},
				default: '',
				description: 'PSID of the message recipient',
			},
			{
				displayName: 'Message Text',
				name: 'messageText',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['message'],
						messageType: ['text'],
					},
				},
				default: '',
				description: 'Text to send',
			},
			{
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				required: true,
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
					{
						name: 'File',
						value: 'file',
					},
				],
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['message'],
						messageType: ['media'],
					},
				},
				default: 'image',
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['message'],
						messageType: ['media'],
					},
				},
				default: '',
				description: 'URL of the media to send',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'message') {
					if (operation === 'send') {
						const messageType = this.getNodeParameter('messageType', i) as string;
						const recipientId = this.getNodeParameter('recipientId', i) as string;

						const body: IDataObject = {
							recipient: { id: recipientId },
							messaging_type: 'RESPONSE',
						};

						if (messageType === 'text') {
							const messageText = this.getNodeParameter('messageText', i) as string;
							body.message = { text: messageText };
						} else if (messageType === 'media') {
							const mediaType = this.getNodeParameter('mediaType', i) as string;
							const mediaUrl = this.getNodeParameter('mediaUrl', i) as string;

							body.message = {
								attachment: {
									type: mediaType,
									payload: {
										url: mediaUrl,
										is_reusable: true,
									},
								},
							};
						}

						// Get credentials
						const credentials = await this.getCredentials('facebookMessengerApi');

						// Make API request
						const options = {
							method: 'POST',
							uri: `https://graph.facebook.com/v21.0/${credentials.pageId}/messages`,
							qs: {
								access_token: credentials.accessToken,
							},
							body,
							json: true,
						};

						const response = await this.helpers.request(options);
						returnData.push(response as IDataObject);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}