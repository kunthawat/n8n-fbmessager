import { INodeType } from 'n8n-workflow';
import { FacebookMessengerAction } from './nodes/FacebookMessengerAction/FacebookMessengerAction.node';
import { FacebookMessengerTrigger } from './nodes/FacebookMessengerTrigger/FacebookMessengerTrigger.node';

export const nodes: INodeType[] = [
	new FacebookMessengerAction(),
	new FacebookMessengerTrigger(),
];
