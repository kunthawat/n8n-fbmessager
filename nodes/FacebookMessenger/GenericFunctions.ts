import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	IDataObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request-promise-native';

export async function facebookApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: string,
	resource: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('facebookMessengerApi');

	const options: OptionsWithUri = {
		method,
		body,
		qs,
		uri: `https://graph.facebook.com/v21.0${resource}`,
		json: true,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}
