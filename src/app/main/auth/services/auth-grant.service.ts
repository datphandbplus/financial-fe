import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGrantService implements CanActivate {

	/**
	* @constructor
	* @param {AuthService} authService
	* @param {Router} router
	*/
	constructor(
		private authService	: AuthService,
		private router		: Router
	) {}

	/**
	* Can activate
	* @return {boolean}
	*/
	public canActivate(): boolean {
		if ( !this.authService.isAuthorized() ) {
			this.router.navigate( [ 'login' ] );
		}

		return this.authService.isAuthorized();
	}

}
