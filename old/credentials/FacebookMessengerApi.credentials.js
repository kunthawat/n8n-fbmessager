"use strict";
exports.__esModule = true;
exports.FacebookMessengerApi = void 0;
var FacebookMessengerApi = /** @class */ (function () {
    function FacebookMessengerApi() {
        this.name = 'facebookMessengerApi';
        this.displayName = 'Facebook Messenger API';
        this.documentationUrl = 'https://developers.facebook.com/docs/messenger-platform';
        this.properties = [
            {
                displayName: 'Page ID',
                name: 'pageId',
                type: 'string',
                "default": '',
                required: true
            },
            {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                typeOptions: {
                    password: true
                },
                "default": '',
                required: true
            },
            {
                displayName: 'Verify Token',
                name: 'verifyToken',
                type: 'string',
                typeOptions: {
                    password: true
                },
                "default": '',
                required: true,
                description: 'Token to verify webhook subscription with Facebook'
            },
        ];
    }
    return FacebookMessengerApi;
}());
exports.FacebookMessengerApi = FacebookMessengerApi;
