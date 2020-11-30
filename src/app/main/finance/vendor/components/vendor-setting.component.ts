import { OnDestroy, Component, Injector } from '@angular/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { Direction } from '@finance/finance-direction.component';

@Component({
	selector	: 'vendor-setting',
	templateUrl	: '../templates/vendor-setting.pug',
	styleUrls	: [ '../styles/vendor-setting.scss' ],
})
@Direction({
	path	: 'vendor',
	data	: { title: 'FINANCE.DIRECTION.VENDOR', icon: 'icon icon-vendor' },
	priority: 30,
	roles: [
		'CEO', 'ADMIN',
		'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
	],
})
export class VendorSettingComponent extends FinanceBaseComponent implements OnDestroy {

	/**
	* @constructor
	* @param {Injector} injector
	*/
	constructor( public injector: Injector ) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

}
