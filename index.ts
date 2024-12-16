import { INodeTypes } from 'n8n-workflow';
import { FacebookMessenger } from './nodes/FacebookMessenger/FacebookMessenger.node';
import { FacebookMessengerTrigger } from './nodes/FacebookMessenger/FacebookMessengerTrigger.node';

export const nodeTypes: INodeTypes = {
    facebookMessenger: new FacebookMessenger(),
    facebookMessengerTrigger: new FacebookMessengerTrigger(),
};
