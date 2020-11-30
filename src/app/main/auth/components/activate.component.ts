import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import _ from 'underscore';

import { EqualValidatorDirective, SnackBarService } from '@core';
import { ENVIRONMENT } from '@environments/environment';
import { AuthService } from '@auth/services/auth.service';

@Component({
	selector		: 'activate',
	templateUrl		: '../templates/activate.pug',
	styleUrls		: [ '../styles/auth.scss' ],
	host			: { class: 'flex-noshrink layout-column' },
	encapsulation	: ViewEncapsulation.None,
})
export class ActivateComponent implements OnDestroy {

	public sub: any;
	public setPasswordForm: FormGroup;
	public token: string;
	public isSubmitting: boolean;
	public isResetPassword: boolean;
	public user: any = {};
	public ENVIRONMENT: any = ENVIRONMENT;

	/**
	* @constructor
	* @param {ActivatedRoute} route
	* @param {Router} router
	* @param {FormBuilder} fb
	* @param {AuthService} authService
	* @param {SnackBarService} snackBarService
	*/
	constructor(
		public route			: ActivatedRoute,
		public router			: Router,
		public fb				: FormBuilder,
		public authService		: AuthService,
		public snackBarService	: SnackBarService
	) {
		this.sub = this.route.queryParams.subscribe( ( queryParams: any ) => {
			if ( !queryParams.token ) {
				this.router.navigate( [ '/login' ] );
				return;
			}

			this.isResetPassword = queryParams.action === 'reset';
			this.token = queryParams.token;
			this.checkActivateToken();
		} );

		this.setPasswordForm = fb.group(
			{
				new_password: [
					{ value: null, disabled: false },
					Validators.compose([
						Validators.required,
						Validators.minLength( 8 ),
						Validators.maxLength( 255 ),
					]),
				],
				confirm_new_password: [
					{ value: null, disabled: false },
					Validators.compose([
						Validators.required,
						Validators.minLength( 8 ),
						Validators.maxLength( 255 ),
					]),
				],
			},
			{ validator: EqualValidatorDirective.MatchPassword }
		);
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		this.sub && _.isFunction( this.sub.unsubscribe ) && this.sub.unsubscribe();
	}

	/**
	* Check activate token
	* @return {void}
	*/
	public checkActivateToken() {
		this.isSubmitting = true;

		this.authService
		.checkActivateToken( this.token )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( result && result.status ) return;

			if ( result && result.message === 'ACCOUNT_IS_ACTIVATED' ) {
				if ( !this.isResetPassword ) {
					this.snackBarService.success( 'AUTH.LOGIN.MESSAGES.ACTIVATE_SUCCESS' );
					this.router.navigate( [ '/login' ] );
				}

				return;
			}

			this.snackBarService.warn( 'AUTH.LOGIN.MESSAGES.ACTIVATE_FAIL' );
		} );
	}

	/**
	* Activate
	* @return {void}
	*/
	public activate() {
		this.isSubmitting = true;

		this.authService
		.activate( this.user, this.token )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'AUTH.LOGIN.MESSAGES.ACTIVATE_FAIL' );
				return;
			}

			this.snackBarService.success( 'AUTH.LOGIN.MESSAGES.ACTIVATE_SUCCESS' );
			this.router.navigate( [ '/login' ] );
		} );
	}

	/**
	* Reset password
	* @return {void}
	*/
	public resetPassword() {
		this.isSubmitting = true;

		this.authService
		.resetPassword( this.user, this.token )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'AUTH.LOGIN.MESSAGES.RESET_PASSWORD_FAIL' );
				return;
			}

			this.snackBarService.success( 'AUTH.LOGIN.MESSAGES.RESET_PASSWORD_SUCCESS' );
			this.router.navigate( [ '/login' ] );
		} );
	}

}
