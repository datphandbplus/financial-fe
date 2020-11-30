import {
	OnInit, OnDestroy,
	AfterViewInit, Injector
} from '@angular/core';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import _ from 'underscore';

import { AuthService } from './main/auth/services/auth.service';
import { AccountService } from './main/account/services/account.service';
import { UtilitiesService, PageService } from '@core';
import { ENVIRONMENT } from '@environments/environment';

export class BootstrapComponent implements OnInit, OnDestroy, AfterViewInit {

	public account: any;
	public sub: any;
	public viewLoaded: boolean;
	public ENVIRONMENT: any = ENVIRONMENT;
	public UtilitiesService: any = UtilitiesService;

	/**
	* @constructor
	* @param {Injector} injector
	*/
	constructor( public injector: Injector ) {}

	/**
	* @constructor
	*/
	public ngOnInit() {
		if ( !this.isAuthorized() ) return;

		this.getUserAccount();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		this.sub && _.isFunction( this.sub.unsubscribe ) && this.sub.unsubscribe();
	}

	/**
	* @constructor
	*/
	public ngAfterViewInit() {
		this.viewLoaded = true;
	}

	/**
	* Get user account
	* @return {void}
	*/
	public getUserAccount() {
		const accountService: AccountService = this.injector.get( AccountService );

		this.sub = accountService
		.detectProfileChanged()
		.subscribe( ( result: any ) => this.account = result );
	}

	/**
	* Get user account
	* @return {ReplaySubject}
	*/
	public getPageTitle(): ReplaySubject<string> {
		const pageService: PageService = this.injector.get( PageService );
		return pageService.title;
	}

	/**
	* Navigate to homepage
	* @return {void}
	*/
	public navigateToHomepage() {
		const router: Router = this.injector.get( Router );

		router.navigate( [ 'finance/dashboard' ] );
	}

	/**
	* Navigate to account setting page
	* @return {void}
	*/
	public navigateToAccountSettings() {
		const router: Router = this.injector.get( Router );
		router.navigate( [ 'account-settings' ] );
	}

	/**
	* Navigate to logout page
	* @return {void}
	*/
	public navigateToLogout() {
		const router: Router = this.injector.get( Router );
		router.navigate( [ 'logout' ] );
	}

	/**
	* Is authorized
	* @return {boolean}
	*/
	public isAuthorized(): boolean {
		const authService: AuthService = this.injector.get( AuthService );
		return authService.isAuthorized();
	}

}
