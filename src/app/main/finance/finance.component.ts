import {
	AfterViewInit, OnInit, Injector,
	OnDestroy, Component
} from '@angular/core';

import { BootstrapComponent } from '@app/bootstrap.component';

@Component({
	selector	: 'finance-app',
	templateUrl	: '../../../templates/finance-app.pug',
	host		: { class: 'flex-noshrink layout-column' },
})
export class FinanceComponent extends BootstrapComponent implements OnInit, OnDestroy, AfterViewInit {

	/**
	* @constructor
	* @param {Injector} injector
	* @param {ApiService} apiService
	* @param {AccountService} accountService
	* @param {ServiceWorkerService} serviceWorkerService
	* @param {AuthService} authService
	* @param {TranslateService} translateService
	* @param {PageService} pageService
	*/
	constructor( public injector: Injector ) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		super.ngOnInit();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* @constructor
	*/
	public ngAfterViewInit() {
		super.ngAfterViewInit();
	}

}
