import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AccountService } from '@account/services/account.service';

@Component({
	selector: 'logout',
	template: '',
})
export class LogoutComponent {

	/**
	* @constructor
	* @param {AccountService} accountService
	* @param {Router} router
	*/
	constructor(
		public accountService	: AccountService,
		public router			: Router
	) {
		this.accountService.logout().subscribe();
		this.router.navigate( [ 'login' ] );
	}

}
