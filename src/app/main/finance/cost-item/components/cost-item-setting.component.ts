import { OnDestroy, Component, Injector } from '@angular/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { Direction } from '@finance/finance-direction.component';

@Component({
	selector	: 'cost-item-setting',
	templateUrl	: '../templates/cost-item-setting.pug',
	styleUrls	: [ '../styles/cost-item-setting.scss' ],
})
@Direction({
	path	: 'cost-item',
	data	: { title: 'FINANCE.DIRECTION.COST_ITEM', icon: 'icon icon-cost-item' },
	priority: 50,
	roles	: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
})
export class CostItemSettingComponent extends FinanceBaseComponent implements OnDestroy {

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
