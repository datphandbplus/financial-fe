import { OnInit, Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import { Router } from '@angular/router';

import { ENVIRONMENT } from '@environments/environment';
import { AuthService } from '@auth/services/auth.service';
import { AccountService } from '@account/services/account.service';
import { StoreService } from '@core';

@Component({
	selector		: 'login',
	templateUrl		: '../templates/login.pug',
	styleUrls		: [ '../styles/auth.scss' ],
	host			: { class: 'flex-noshrink layout-column' },
	encapsulation	: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {

	public loginForm: FormGroup;
	public forgotPasswordForm: FormGroup;
	public channelForm: FormGroup;
	public isSubmitting: boolean;
	public ENVIRONMENT: any = ENVIRONMENT;
	public employee: any = {};
	public isLoginState: boolean = true;
	public channel: any = { id: null, exists: false };

	/**
	* @constructor
	* @param {Router} router
	* @param {FormBuilder} fb
	* @param {AuthService} authService
	* @param {AccountService} accountService
	* @param {SnackBarService} snackBarService
	* @param {StoreService} storeService
	*/
	constructor(
		public router			: Router,
		public fb				: FormBuilder,
		public authService		: AuthService,
		public accountService	: AccountService,
		public snackBarService	: SnackBarService,
		public storeService		: StoreService
	) {
		this.loginForm = fb.group({
			email: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.email,
				]),
			],
			password: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 8 ),
				]),
			],
		});

		this.forgotPasswordForm = fb.group({
			email: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.email,
				]),
			],
		});

		this.channelForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
		});

		if ( this.authService.isAuthorized() ) {
			this.accountService.getProfile()
			.subscribe(
				() => this.router.navigate( [ this.accountService.isConstruction ? 'finance/project' : 'finance/dashboard' ] )
			);
		}
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		if ( this.authService.isAuthorized() ) return;

		if ( !ENVIRONMENT.MULTI_CHANNELS ) {
			this.checkChannel( true );
			return;
		}

		ENVIRONMENT.PRODUCTION && this.checkSubdomain();
	}

	/**
	* Check channel
	* @param {boolean} isAutomation - Automation checking
	* @return {void}
	*/
	public checkChannel( isAutomation: boolean = false ) {
		this.isSubmitting = true;

		this.authService
		.checkChannel( this.channel.id )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warning( 'AUTH.LOGIN.MESSAGES.CHANNEL_NOT_FOUND' );
				isAutomation && this.router.navigate( [ '404' ] );
				return;
			}

			this.channel = result.data;
			this.channel.exists = true;
		} );
	}

	/**
	* Login
	* @return {void}
	*/
	public login() {
		this.isSubmitting = true;

		this.authService
		.login( this.employee, this.channel )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'USER_DISABLED' ) {
					this.snackBarService.warning( 'AUTH.LOGIN.MESSAGES.USER_DISABLED' );
					return;
				}

				this.snackBarService.warning( 'AUTH.LOGIN.MESSAGES.USER_LOGIN_FAIL' );
				return;
			}

			this.accountService.getProfile()
			.subscribe( () => {
				if ( this.accountService.isAdmin() ) {
					this.router.navigate( [ 'finance/line-item/category' ] );
					return;
				}

				this.router.navigate( [ this.accountService.isConstruction ? 'finance/project' : 'finance/dashboard' ] );
			} );
		} );
	}

	/**
	* Forgot password
	* @return {void}
	*/
	public forgotPassword() {
		this.isSubmitting = true;

		this.authService
		.forgotPassword( this.employee, this.channel )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'USER_NOT_FOUND' ) {
					this.snackBarService.warning( 'AUTH.LOGIN.MESSAGES.USER_NOT_FOUND' );
					return;
				}

				this.snackBarService.warn( 'AUTH.LOGIN.MESSAGES.USER_PASSWORD_RESET_FAIL' );
				return;
			}

			this.snackBarService.success( 'AUTH.LOGIN.MESSAGES.USER_PASSWORD_RESET_SUCCESS' );
			this.isLoginState = true;
		} );
	}

	/**
	* Check subdomain to get channel
	* @return {void}
	*/
	public checkSubdomain() {
		const domain: string = window.location.hostname.replace( ENVIRONMENT.APP_DOMAIN, '' );
		const domainArr: Array<string> = domain.split( '.' );

		if ( !domainArr
			|| !domainArr.length
			|| !domainArr[ 0 ].length
			|| domainArr[ 0 ] === 'www' ) {
			return;
		}

		this.channel.id = domainArr[ 0 ];
		this.checkChannel( true );
	}

}
