import {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	IWebhookFunctions,
	NodeOperationError,
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
		outputs: ['main'],
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
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Include Sender Info',
						name: 'includeSenderInfo',
						type: 'boolean',
						default: true,
						description: 'Whether to include sender information in the output',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<ITriggerResponse> {
		const webhookData = this.getWebhookName();
		const events = this.getNodeParameter('events') as string[];
		const req = this.getRequestObject();

		// Verify webhook
		if (req.method === 'GET') {
			const mode = this.getQueryParameter('hub.mode');
			const token = this.getQueryParameter('hub.verify_token');
			const challenge = this.getQueryParameter('hub.challenge');

			if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
				return {
					webhookResponse: challenge,
				};
			}
			throw new NodeOperationError(this.getNode(), 'Invalid verification token');
		}

		// Process webhook payload
		const body = this.getBodyData();
		if (body.object === 'page') {
			const returnData: IDataObject[] = [];

			for (const entry of body.entry) {
				const messaging = entry.messaging[0];

				if (messaging.message && events.includes('messages')) {
					returnData.push({
						messageId: messaging.message.mid,
						messageText: messaging.message.text,
						senderId: messaging.sender.id,
						recipientId: messaging.recipient.id,
						timestamp: messaging.timestamp,
						eventType: 'message_received',
					});
				}

				if (messaging.delivery && events.includes('message_deliveries')) {
					returnData.push({
						messageIds: messaging.delivery.mids,
						senderId: messaging.sender.id,
						recipientId: messaging.recipient.id,
						timestamp: messaging.delivery.watermark,
						eventType: 'message_delivered',
					});
				}

				if (messaging.read && events.includes('message_reads')) {
					returnData.push({
						senderId: messaging.sender.id,
						recipientId: messaging.recipient.id,
						timestamp: messaging.read.watermark,
						eventType: 'message_read',
					});
				}
			}

			if (returnData.length) {
				return {
					workflowData: [returnData],
				};
			}
		}

		return {
			noWebhookResponse: true,
		};
	}
}
