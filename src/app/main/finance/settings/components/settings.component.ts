import { OnDestroy, Component, Injector } from '@angular/core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { Direction } from '@finance/finance-direction.component';

@Component({
	selector	: 'settings',
	templateUrl	: '../templates/settings.pug',
	styleUrls	: [ '../styles/settings.scss' ],
})
@Direction({
	path	: 'settings',
	data	: { title: 'FINANCE.DIRECTION.SETTINGS', icon: 'icon icon-setting' },
	priority: 10,
	roles	: [ 'CEO', 'ADMIN' ],
})
export class SettingsComponent extends FinanceBaseComponent implements OnDestroy {

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
