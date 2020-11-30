import { OnDestroy, Component, Injector } from '@angular/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { Direction } from '@finance/finance-direction.component';

@Component({
	selector	: 'line-item-setting',
	templateUrl	: '../templates/line-item-setting.pug',
	styleUrls	: [ '../styles/line-item-setting.scss' ],
})
@Direction({
	path	: 'line-item',
	data	: { title: 'FINANCE.DIRECTION.LINE_ITEM', icon: 'icon icon-line-item' },
	priority: 60,
	roles	: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
})
export class LineItemSettingComponent extends FinanceBaseComponent implements OnDestroy {

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
