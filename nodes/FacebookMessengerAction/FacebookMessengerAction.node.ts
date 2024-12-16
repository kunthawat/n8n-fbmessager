import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class FacebookMessengerAction implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Facebook Messenger',
		name: 'facebookMessenger',
		icon: 'file:facebook.svg',
		group: ['transform'],
		version: 1,
		description: 'Send messages through Facebook Messenger',
		defaults: {
			name: 'Facebook Messenger',
		},
		inputs: ['main'],
		outputs: ['main'],
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
				description: 'The ID of the message recipient',
			},
			// Text Message Options
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
			// Template Message Options
			{
				displayName: 'Template Name',
				name: 'templateName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
				required: true,
				description: 'Name of the template to use',
			},
			{
				displayName: 'Language Code',
				name: 'languageCode',
				type: 'string',
				default: 'en',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
				required: true,
				description: 'Language code (e.g., en, es, fr)',
			},
			{
				displayName: 'Template Variables',
				name: 'templateVariables',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: ['sendTemplate'],
					},
				},
				required: true,
				description: 'Variables to replace in the template',
			},
			// Media Options
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
				description: 'Type of media to send',
			},
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendMedia'],
					},
				},
				required: true,
				description: 'URL of the media to send',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		try {
			for (let i = 0; i < items.length; i++) {
				const recipientId = this.getNodeParameter('recipientId', i) as string;
				let messageData: any = {
					messaging_type: 'RESPONSE',
					recipient: {
						id: recipientId,
					},
				};

				if (operation === 'sendMessage') {
					const messageText = this.getNodeParameter('messageText', i) as string;
					messageData.message = {
						text: messageText,
					};
				} else if (operation === 'sendTemplate') {
					const templateName = this.getNodeParameter('templateName', i) as string;
					const languageCode = this.getNodeParameter('languageCode', i) as string;
					const templateVariables = this.getNodeParameter('templateVariables', i) as string;

					messageData.message = {
						template: {
							name: templateName,
							language: {
								code: languageCode,
							},
							components: JSON.parse(templateVariables),
						},
					};
				} else if (operation === 'sendMedia') {
					const mediaType = this.getNodeParameter('mediaType', i) as string;
					const mediaUrl = this.getNodeParameter('mediaUrl', i) as string;

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

				// Make API call to send message
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://graph.facebook.com/v13.0/me/messages',
					headers: {
						'Content-Type': 'application/json',
					},
					body: messageData,
				});

				returnData.push({
					json: response,
					pairedItem: {
						item: i,
					},
				});
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
					pairedItem: {
						item: 0,
					},
				});
			} else {
				throw error;
			}
		}

		return [returnData];
	}
}
