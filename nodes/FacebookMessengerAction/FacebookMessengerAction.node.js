"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.FacebookMessengerAction = void 0;
var FacebookMessengerAction = /** @class */ (function () {
    function FacebookMessengerAction() {
        this.description = {
            displayName: 'Facebook Messenger',
            name: 'facebookMessenger',
            icon: 'file:facebook.svg',
            group: ['transform'],
            version: 1,
            description: 'Send messages through Facebook Messenger',
            defaults: {
                name: 'Facebook Messenger'
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'facebookApi',
                    required: true
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
                            action: 'Send a message'
                        },
                        {
                            name: 'Send Template',
                            value: 'sendTemplate',
                            description: 'Send a template message',
                            action: 'Send a template message'
                        },
                        {
                            name: 'Send Media',
                            value: 'sendMedia',
                            description: 'Send media (image, video, file)',
                            action: 'Send media'
                        },
                    ],
                    "default": 'sendMessage'
                },
                {
                    displayName: 'Recipient ID',
                    name: 'recipientId',
                    type: 'string',
                    "default": '',
                    required: true,
                    description: 'The ID of the message recipient'
                },
                // Text Message Options
                {
                    displayName: 'Message Text',
                    name: 'messageText',
                    type: 'string',
                    "default": '',
                    displayOptions: {
                        show: {
                            operation: ['sendMessage']
                        }
                    },
                    required: true,
                    description: 'The text to send'
                },
                // Template Message Options
                {
                    displayName: 'Template Name',
                    name: 'templateName',
                    type: 'string',
                    "default": '',
                    displayOptions: {
                        show: {
                            operation: ['sendTemplate']
                        }
                    },
                    required: true,
                    description: 'Name of the template to use'
                },
                {
                    displayName: 'Language Code',
                    name: 'languageCode',
                    type: 'string',
                    "default": 'en',
                    displayOptions: {
                        show: {
                            operation: ['sendTemplate']
                        }
                    },
                    required: true,
                    description: 'Language code (e.g., en, es, fr)'
                },
                {
                    displayName: 'Template Variables',
                    name: 'templateVariables',
                    type: 'json',
                    "default": '{}',
                    displayOptions: {
                        show: {
                            operation: ['sendTemplate']
                        }
                    },
                    required: true,
                    description: 'Variables to replace in the template'
                },
                // Media Options
                {
                    displayName: 'Media Type',
                    name: 'mediaType',
                    type: 'options',
                    displayOptions: {
                        show: {
                            operation: ['sendMedia']
                        }
                    },
                    options: [
                        {
                            name: 'Image',
                            value: 'image'
                        },
                        {
                            name: 'Video',
                            value: 'video'
                        },
                        {
                            name: 'File',
                            value: 'file'
                        },
                    ],
                    "default": 'image',
                    description: 'Type of media to send'
                },
                {
                    displayName: 'Media URL',
                    name: 'mediaUrl',
                    type: 'string',
                    "default": '',
                    displayOptions: {
                        show: {
                            operation: ['sendMedia']
                        }
                    },
                    required: true,
                    description: 'URL of the media to send'
                },
            ]
        };
    }
    FacebookMessengerAction.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var items, returnData, operation, i, recipientId, messageData, messageText, templateName, languageCode, templateVariables, mediaType, mediaUrl, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        items = this.getInputData();
                        returnData = [];
                        operation = this.getNodeParameter('operation', 0);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < items.length)) return [3 /*break*/, 5];
                        recipientId = this.getNodeParameter('recipientId', i);
                        messageData = {
                            messaging_type: 'RESPONSE',
                            recipient: {
                                id: recipientId
                            }
                        };
                        if (operation === 'sendMessage') {
                            messageText = this.getNodeParameter('messageText', i);
                            messageData.message = {
                                text: messageText
                            };
                        }
                        else if (operation === 'sendTemplate') {
                            templateName = this.getNodeParameter('templateName', i);
                            languageCode = this.getNodeParameter('languageCode', i);
                            templateVariables = this.getNodeParameter('templateVariables', i);
                            messageData.message = {
                                template: {
                                    name: templateName,
                                    language: {
                                        code: languageCode
                                    },
                                    components: JSON.parse(templateVariables)
                                }
                            };
                        }
                        else if (operation === 'sendMedia') {
                            mediaType = this.getNodeParameter('mediaType', i);
                            mediaUrl = this.getNodeParameter('mediaUrl', i);
                            messageData.message = {
                                attachment: {
                                    type: mediaType,
                                    payload: {
                                        url: mediaUrl,
                                        is_reusable: true
                                    }
                                }
                            };
                        }
                        return [4 /*yield*/, this.helpers.httpRequest({
                                method: 'POST',
                                url: 'https://graph.facebook.com/v13.0/me/messages',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: messageData
                            })];
                    case 3:
                        response = _a.sent();
                        returnData.push({
                            json: response,
                            pairedItem: {
                                item: i
                            }
                        });
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        if (this.continueOnFail()) {
                            returnData.push({
                                json: {
                                    error: error_1.message
                                },
                                pairedItem: {
                                    item: 0
                                }
                            });
                        }
                        else {
                            throw error_1;
                        }
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, [returnData]];
                }
            });
        });
    };
    return FacebookMessengerAction;
}());
exports.FacebookMessengerAction = FacebookMessengerAction;
