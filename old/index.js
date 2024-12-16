"use strict";
exports.__esModule = true;
exports.nodeTypes = void 0;
var FacebookMessenger_node_1 = require("./FacebookMessenger/FacebookMessenger.node");
var FacebookMessengerTrigger_node_1 = require("./FacebookMessenger/FacebookMessengerTrigger.node");
exports.nodeTypes = {
    facebookMessenger: new FacebookMessenger_node_1.FacebookMessenger(),
    facebookMessengerTrigger: new FacebookMessengerTrigger_node_1.FacebookMessengerTrigger()
};
