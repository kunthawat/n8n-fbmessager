"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookMessengerApi = void 0;
class FacebookMessengerApi {
    constructor() {
        this.name = 'facebookMessengerApi';
        this.displayName = 'Facebook Messenger API';
        this.documentationUrl = 'https://developers.facebook.com/docs/messenger-platform';
        this.properties = [
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
        ];
    }
}
exports.FacebookMessengerApi = FacebookMessengerApi;
//# sourceMappingURL=FacebookMessengerApi.credentials.js.map