import {
	Component, Inject, Injector,
	OnDestroy, OnInit, ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import {
	FormGroup, FormBuilder,
	FormArray, Validators
} from '@angular/forms';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';

import { ClientService } from '@finance/client/services/client.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { LezoClientService } from '@ext/lezo/services/lezo-client.service';
import { PROVINCE_MAP, REGEXES } from '@resources';
import { DialogConfirmComponent } from '@core';

@Component({
	selector	: 'dialog-client',
	templateUrl	: '../templates/dialog-client.pug',
})
export class DialogClientComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public clientForm: FormGroup;
	public isSubmitting: boolean;
	public maxContacts: number = 20;
	public client: any = { contact_list: [], payment_term: 0 };
	public PROVINCE_MAP: any = PROVINCE_MAP;
	public contactListControl: Array<boolean> = [];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {ClientService} clientService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {MatDialog} dialog
	* @param {ChangeDetectorRef} cdRef
	* @param {LezoClientService} lezoClientService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogClientComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public clientService	: ClientService,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService,
		public dialog			: MatDialog,
		public cdRef			: ChangeDetectorRef,
		public lezoClientService: LezoClientService
	) {
		super( injector );

		this.clientForm = fb.group({
			lezo_client_id: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.min( 0 ),
				]),
			],
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			short_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			phone: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			payment_term: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
					Validators.pattern( REGEXES.INT_NUMBER ),
				]),
			],
			tax: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			address: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_branch: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_account_number: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			bank_province	: [{ value: null, disabled: false }],
			description		: [{ value: null, disabled: false }],
			contact_list	: this.fb.array( [] ),
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.client, this.data );

		_.each( this.client.contact_list, () => {
			const control: FormArray = <FormArray> this.clientForm.controls.contact_list;

			control.push( this.getClientContactFB() );
			this.contactListControl.push( true );
			this.cdRef.detectChanges();
		} );
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
	* Create client
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.clientService
		.create( this.client )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'CLIENT_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.CLIENT.MESSAGES.CLIENT_ALREADY_EXISTS', this.client );
					return;
				}

				this.snackBarService.warn( 'FINANCE.CLIENT.MESSAGES.CREATE_CLIENT_FAIL', this.client );
				return;
			}

			this.snackBarService.success( 'FINANCE.CLIENT.MESSAGES.CREATE_CLIENT_SUCCESS', this.client );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update client
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.clientService
		.update( this.client.id, this.client )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'CLIENT_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.CLIENT.MESSAGES.CLIENT_ALREADY_EXISTS', this.client );
					return;
				}

				this.snackBarService.warn( 'FINANCE.CLIENT.MESSAGES.UPDATE_CLIENT_FAIL', this.client );
				return;
			}

			this.snackBarService.success( 'FINANCE.CLIENT.MESSAGES.UPDATE_CLIENT_SUCCESS', this.client );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Get contact form builder
	* @return {void}
	*/
	public getClientContactFB() {
		return this.fb.group({
			info: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
		});
	}

	/**
	* Add client contact
	* @return {void}
	*/
	public addClientContactFB() {
		const control: FormArray = <FormArray> this.clientForm.controls.contact_list;

		this.client.contact_list.push( '' );
		this.contactListControl.push( false );

		control.push( this.getClientContactFB() );
	}

	/**
	* Remove client contact
	* @param {number} i
	* @return {void}
	*/
	public removeClientContactFB( i: number ) {
		const dialogRef2: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.CLIENT.TITLES.DELETE_CONTACT' ),
					content	: this.translateService.instant( 'FINANCE.CLIENT.MESSAGES.DELETE_CONTACT_CONFIRMATION' ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef2
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			const control: FormArray = <FormArray> this.clientForm.controls.contact_list;

			this.client.contact_list.splice( i, 1 );
			this.contactListControl.splice( i, 1 );
			control.removeAt( i );
		} );
	}

	/**
	* Edit client contact
	* @param {number} i
	* @return {void}
	*/
	public editContactList( i: number ) {
		this.contactListControl[ i ] = !this.contactListControl[ i ];
	}

	/**
	* Is editing form
	* @return {boolean}
	*/
	public isEditing() {
		return _.contains( this.contactListControl, false );
	}

	/**
	* On Lezo client change
	* @param {any} ev
	* @return {boolean}
	*/
	public onLezoClientChange( ev: any ) {
		if ( !ev ) return;

		this.client.name = ev.name;
		this.client.short_name = ev.name;
		this.client.description = ev.description;
	}

}
