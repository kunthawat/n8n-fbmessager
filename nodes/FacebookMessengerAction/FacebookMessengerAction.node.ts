import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IDataObject,
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		try {
			for (let i = 0; i < items.length; i++) {
				const recipientId = this.getNodeParameter('recipientId', i) as string;
				const messageData: IDataObject = {
					messaging_type: 'RESPONSE',
					recipient: {
						id: recipientId,
					},
					message: {},
				};

				if (operation === 'sendMessage') {
					const messageText = this.getNodeParameter('messageText', i) as string;
					messageData.message = {
						text: messageText,
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
					json: response as IDataObject,
				});
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
				});
			} else {
				throw error;
			}
		}

		return [returnData];
	}
}
