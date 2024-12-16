import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FacebookApi implements ICredentialType {
	name = 'facebookApi';
	displayName = 'Facebook API';
	documentationUrl = 'https://developers.facebook.com/docs/messenger-platform';
	properties: INodeProperties[] = [
		{
			displayName: 'Page Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The page access token from Facebook',
		},
		{
			displayName: 'Verify Token',
			name: 'verifyToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The verify token you set in Facebook webhook settings',
		},
	];
}
