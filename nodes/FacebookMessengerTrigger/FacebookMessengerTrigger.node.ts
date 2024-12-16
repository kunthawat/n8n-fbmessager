import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';

export class FacebookMessengerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Facebook Messenger Trigger',
		name: 'facebookMessengerTrigger',
		icon: 'file:facebook.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Facebook Messenger events occur',
		defaults: {
			name: 'Facebook Messenger Trigger',
		},
		inputs: [],
		outputs: [{ type: NodeConnectionType.Main }],
		credentials: [
			{
				name: 'facebookApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Message Received',
						value: 'messages',
						description: 'Trigger when a new message is received',
					},
					{
						name: 'Message Read',
						value: 'message_reads',
						description: 'Trigger when a message is read',
					},
					{
						name: 'Message Delivered',
						value: 'message_deliveries',
						description: 'Trigger when a message is delivered',
					},
				],
				default: ['messages'],
				required: true,
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headerData = this.getHeaderData();
		const events = this.getNodeParameter('events') as string[];

		// Verify webhook
		if (req.method === 'GET') {
			const mode = headerData['hub.mode'];
			const token = headerData['hub.verify_token'];
			const challenge = headerData['hub.challenge'];

			if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
				return {
					webhookResponse: challenge,
				};
			}
			return {
				webhookResponse: 'Forbidden',
			};
		}

		// Process webhook payload
		const body = this.getBodyData() as IDataObject;
		if (body.object === 'page') {
			const returnData: INodeExecutionData[] = [];
			const entries = body.entry as IDataObject[];

			for (const entry of entries) {
				const messaging = (entry.messaging as IDataObject[])[0];

				if (messaging.message && events.includes('messages')) {
					returnData.push({
						json: {
							messageId: (messaging.message as IDataObject).mid,
							messageText: (messaging.message as IDataObject).text,
							senderId: (messaging.sender as IDataObject).id,
							recipientId: (messaging.recipient as IDataObject).id,
							timestamp: messaging.timestamp,
							eventType: 'message_received',
						},
					});
				}
			}

			if (returnData.length) {
				return {
					webhookResponse: { success: true },
					workflowData: [returnData], // Wrap returnData in an array to match INodeExecutionData[][]
				};
			}
		}

		return {
			webhookResponse: { success: true },
		};
	}
}
