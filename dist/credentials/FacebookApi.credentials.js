"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookApi = void 0;
class FacebookApi {
    constructor() {
        this.name = 'facebookApi';
        this.displayName = 'Facebook API';
        this.documentationUrl = 'https://developers.facebook.com/docs/messenger-platform';
        this.properties = [
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
}
exports.FacebookApi = FacebookApi;
//# sourceMappingURL=FacebookApi.credentials.js.map