import {
	Component, Inject, Injector,
	OnDestroy, OnInit
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Observer } from 'rxjs';
import _ from 'underscore';

import { AccountService } from '@account/services/account.service';
import { UserService } from '@finance/user/services/user.service';
import { UserRoleService } from '@finance/user/services/user-role.service';
import { LezoEmployeeService } from '@ext/lezo/services/lezo-employee.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { REGEXES } from '@resources';
import { SnackBarService } from '@core';

@Component({
	selector	: 'dialog-user',
	templateUrl	: '../templates/dialog-user.pug',
})
export class DialogUserComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public userForm: FormGroup;
	public isSubmitting: boolean;
	public user: any = { is_send_activation: true };
	public REGEXES: any = REGEXES;

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {UserService} userService
	* @param {UserRoleService} userRoleService
	* @param {LezoEmployeeService} lezoEmployeeService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {AccountService} accountService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef			: MatDialogRef<DialogUserComponent>,
		public injector				: Injector,
		public fb					: FormBuilder,
		public userService			: UserService,
		public userRoleService		: UserRoleService,
		public lezoEmployeeService	: LezoEmployeeService,
		public snackBarService		: SnackBarService,
		public translateService		: TranslateService,
		public accountService		: AccountService
	) {
		super( injector );

		this.userForm = fb.group({
			lezo_employee_id: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.min( 0 ),
				]),
			],
			full_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			email: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.pattern( REGEXES.EMAIL ),
				]),
			],
			role_key: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			is_send_activation: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.user, this.data );
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Click No button event
	* @return {void}
	*/
	public onNoClick() {
		this.dialogRef.close();
	}

	/**
	* Create user
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.userService
		.create( this.user )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'USER_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.USER.MESSAGES.USER_ALREADY_EXISTS', this.user );
					return;
				}

				this.snackBarService.warn( 'FINANCE.USER.MESSAGES.CREATE_USER_FAIL', this.user );
				return;
			}

			this.snackBarService.success( 'FINANCE.USER.MESSAGES.CREATE_USER_SUCCESS', this.user );
			this.dialogRef.close( true );
		} );
	}

	/**
	* Update user
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.userService
		.update( this.user.id, this.user )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'USER_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.USER.MESSAGES.USER_ALREADY_EXISTS', this.user );
					return;
				}

				this.snackBarService.warn( 'FINANCE.USER.MESSAGES.UPDATE_USER_FAIL', this.user );
				return;
			}

			this.snackBarService.success( 'FINANCE.USER.MESSAGES.UPDATE_USER_SUCCESS', this.user );
			this.dialogRef.close( true );
		} );
	}

	/**
	* Load user roles
	* @return {Observable}
	*/
	public loadUserRoles(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.userRoleService
			.getAll()
			.subscribe(
				( result: any ) => {
					if ( !this.isSuperAdmin ) {
						const index: number = _.findIndex( result, { key: 'CEO' } );
						index >= -1 && result.splice( index, 1 );
					}

					observer.next( result );
				},
				() => {},
				() => observer.complete()
			);
		} );
	}

	/**
	* On Lezo employee change
	* @param {any} ev
	* @return {boolean}
	*/
	public onLezoEmployeeChange( ev: any ) {
		if ( !ev ) return;

		this.user.full_name = ev.full_name;
		this.user.email = ev.email;
	}

}
