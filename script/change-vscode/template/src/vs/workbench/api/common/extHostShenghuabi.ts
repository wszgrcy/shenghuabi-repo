import { MainContext, ExtHostShenghuabiShape } from './extHost.protocol.js';
import { createDecorator } from '../../../platform/instantiation/common/instantiation.js';
import { IExtHostRpcService } from './extHostRpcService.js';



export class ExtHostShenghuabi implements ExtHostShenghuabiShape {


	#proxy

	constructor(
		@IExtHostRpcService extHostRpc: IExtHostRpcService,
	) {
		this.#proxy = extHostRpc.getProxy(MainContext.MainThreadShenghuabi);

	}
	$call(id: string, args?: any) {
		return this.#proxy.$call(id, args)
	}

}

export interface IExtHostShenghuabi extends ExtHostShenghuabi { }
export const IExtHostShenghuabi = createDecorator<IExtHostShenghuabi>('IExtHostShenghuabi');
