import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
	IDataObject,
	INodeExecutionData,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
	IHttpRequestOptions,
	ICredentialsDecrypted,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';

interface IFacebookQueryData {
	'hub.mode': string;
	'hub.verify_token': string;
	'hub.challenge': string;
}

export class FacebookMessengerTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Facebook Messenger Trigger',
		name: 'facebookMessengerTrigger',
		icon: 'file:FacebookMessengerTrigger.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Handle Facebook Messenger webhook events',
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
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: 'webhook',
			},
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
					{
						name: 'Postback',
						value: 'messaging_postbacks',
						description: 'Trigger when a postback is received',
					},
				],
				default: ['messages'],
				required: true,
			},
		],
	};

	methods = {
		credentialTest: {
			async facebookApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
			): Promise<INodeCredentialTestResult> {
				const { accessToken } = credential.data as { accessToken?: string };

				if (!accessToken) {
					return {
						status: 'Error',
						message: 'Access Token is required!',
					};
				}

				const options: IHttpRequestOptions = {
					url: `https://graph.facebook.com/v13.0/me`,
					qs: {
						access_token: accessToken,
					},
					method: 'GET',
					json: true,
				};

				try {
					await this.helpers.request(options);
					return {
						status: 'OK',
						message: 'Authentication successful!',
					};
				} catch (error) {
					return {
						status: 'Error',
						message: error.message,
					};
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const credentials = await this.getCredentials('facebookApi');
		const events = this.getNodeParameter('events') as string[];

		if (!credentials?.verifyToken) {
			throw new Error('Verify Token is required!');
		}

		// Handle GET request (webhook verification)
		if (req.method === 'GET') {
			const query = this.getQueryData() as IFacebookQueryData;
			const mode = query['hub.mode'];
			const token = query['hub.verify_token'];
			const challenge = query['hub.challenge'];

			// Check if the mode and token are correct
			if (mode === 'subscribe' && token === credentials.verifyToken) {
				return {
					webhookResponse: challenge,
				};
			} else {
				return {
					webhookResponse: 'Forbidden',
				};
			}
		}

		// Handle POST request (webhook events)
		if (req.method === 'POST') {
			const body = this.getBodyData() as IDataObject;

			if (body.object === 'page') {
				const returnData: INodeExecutionData[] = [];
				const entries = body.entry as IDataObject[];

				for (const entry of entries) {
					const messaging = (entry.messaging as IDataObject[])[0];

					// Handle message events
					if (messaging.message && events.includes('messages')) {
						returnData.push({
							json: {
								messageId: (messaging.message as IDataObject).mid,
								messageText: (messaging.message as IDataObject).text,
								senderId: (messaging.sender as IDataObject).id,
								recipientId: (messaging.recipient as IDataObject).id,
								timestamp: messaging.timestamp,
								eventType: 'message_received',
								rawData: messaging,
							},
						});
					}

					// Handle message_read events
					if (messaging.read && events.includes('message_reads')) {
						returnData.push({
							json: {
								watermark: (messaging.read as IDataObject).watermark,
								senderId: (messaging.sender as IDataObject).id,
								recipientId: (messaging.recipient as IDataObject).id,
								timestamp: messaging.timestamp,
								eventType: 'message_read',
								rawData: messaging,
							},
						});
					}

					// Handle message_delivered events
					if (messaging.delivery && events.includes('message_deliveries')) {
						returnData.push({
							json: {
								watermark: (messaging.delivery as IDataObject).watermark,
								senderId: (messaging.sender as IDataObject).id,
								recipientId: (messaging.recipient as IDataObject).id,
								timestamp: messaging.timestamp,
								eventType: 'message_delivered',
								rawData: messaging,
							},
						});
					}

					// Handle postback events
					if (messaging.postback && events.includes('messaging_postbacks')) {
						returnData.push({
							json: {
								payload: (messaging.postback as IDataObject).payload,
								senderId: (messaging.sender as IDataObject).id,
								recipientId: (messaging.recipient as IDataObject).id,
								timestamp: messaging.timestamp,
								eventType: 'postback',
								rawData: messaging,
							},
						});
					}
				}

				if (returnData.length) {
					return {
						webhookResponse: { success: true },
						workflowData: [returnData],
					};
				}
			}
		}

		return {
			webhookResponse: { success: true },
		};
	}
}
