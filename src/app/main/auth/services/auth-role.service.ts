import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AccountService } from '@account/services/account.service';
import { take } from 'rxjs/operators';

@Injectable()
export class AuthRoleService implements CanActivate {

	/**
	* @constructor
	* @param {AccountService} accountService
	* @param {Router} router
	*/
	constructor(
		private accountService	: AccountService,
		private router			: Router
	) {}

	/**
	* Can activate
	* @param {ActivatedRouteSnapshot} route
	* @return {Promise}
	*/
	public canActivate( route: ActivatedRouteSnapshot ): Promise<boolean> {
		return new Promise( ( resolve: any ) => {
			this.accountService
			.detectProfileChanged()
			.pipe( take( 1 ) )
			.subscribe(
				( stored: any ) => {
					if ( stored && !this.accountService.hasRoles( route.data.roles ) ) {
						this.router.navigate( [ '403' ] );
					}

					resolve( true );
				},
				() => resolve( false )
			);
		} );
	}

}
