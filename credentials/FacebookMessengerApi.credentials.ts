import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class FacebookMessengerApi implements ICredentialType {
    name = 'facebookMessengerApi';
    displayName = 'Facebook Messenger API';
    documentationUrl = 'https://developers.facebook.com/docs/messenger-platform';
    properties: INodeProperties[] = [
        {
            displayName: 'Page ID',
            name: 'pageId',
            type: 'string',
            default: '',
            required: true,
        },
        {
            displayName: 'Access Token',
            name: 'accessToken',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
            required: true,
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
            description: 'Token to verify webhook subscription with Facebook',
        },
    ];
}
