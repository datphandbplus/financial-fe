import { OnDestroy, Injector } from '@angular/core';

import { BaseComponent } from '@main/base.component';
import { AccountService } from '@main/account/services/account.service';

export class FinanceBaseComponent extends BaseComponent implements OnDestroy {

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

	/**
	* Is Super Admin
	* @return {boolean}
	*/
	get isSuperAdmin(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isSuperAdmin();
	}

	/**
	* Is CEO
	* @return {boolean}
	*/
	get isCEO(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isCEO();
	}

	/**
	* Is Admin
	* @return {boolean}
	*/
	get isAdmin(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isAdmin();
	}

	/**
	* Is CFO
	* @return {boolean}
	*/
	get isCFO(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isCFO();
	}

	/**
	* Is General Accountant
	* @return {boolean}
	*/
	get isGeneralAccountant(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isGeneralAccountant();
	}

	/**
	* Is Liabilities Accountant
	* @return {boolean}
	*/
	get isLiabilitiesAccountant(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isLiabilitiesAccountant();
	}

	/**
	* Is PM
	* @return {boolean}
	*/
	get isPM(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isPM();
	}

	/**
	* Is Sale
	* @return {boolean}
	*/
	get isSale(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isSale();
	}

	/**
	* Is Procurement Manager
	* @return {boolean}
	*/
	get isProcurementManager(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isProcurementManager();
	}

	/**
	* Is QS
	* @return {boolean}
	*/
	get isQS(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isQS();
	}

	/**
	* Is Purchasing
	* @return {boolean}
	*/
	get isPurchasing(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isPurchasing();
	}

	/**
	* Is Construction Manager
	* @return {boolean}
	*/
	get isConstructionManager(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isConstructionManager();
	}

	/**
	* Is Construction
	* @return {boolean}
	*/
	get isConstruction(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isConstruction();
	}

	/**
	* Is Finance
	* @return {boolean}
	*/
	get isFinance(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.isFinance();
	}

	/**
	* Has Lezo App
	* @return {boolean}
	*/
	get hasLezoApp(): boolean {
		const accountService: AccountService = this.injector.get( AccountService );
		return accountService.hasLezoApp();
	}

}
