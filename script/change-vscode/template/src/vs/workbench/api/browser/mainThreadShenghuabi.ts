
import { IExtHostContext, extHostNamedCustomer, } from '../../services/extensions/common/extHostCustomers.js';
import { MainContext, MainThreadShenghuabiShape } from '../common/extHost.protocol.js';
import { IMainProcessService } from '../../../platform/ipc/common/mainProcessService.js';

@extHostNamedCustomer(MainContext.MainThreadShenghuabi)
export class MainThreadShenghuabi implements MainThreadShenghuabiShape {


	#channel
	constructor(
		extHostContext: IExtHostContext,
		@IMainProcessService mainProcessService: IMainProcessService
	) {
		this.#channel = mainProcessService.getChannel('ShengHuabi')
	}

	dispose() {

	}

	$call(id: string, args?: any): any {
		return this.#channel.call(id, args)
	}
}

