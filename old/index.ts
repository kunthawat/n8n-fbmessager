import { INodeTypes } from 'n8n-workflow';
import { FacebookMessenger } from './FacebookMessenger/FacebookMessenger.node';
import { FacebookMessengerTrigger } from './FacebookMessenger/FacebookMessengerTrigger.node';

export const nodeTypes: INodeTypes = {
    facebookMessenger: new FacebookMessenger(),
    facebookMessengerTrigger: new FacebookMessengerTrigger(),
};
