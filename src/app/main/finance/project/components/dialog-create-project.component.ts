import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ClientService } from '@finance/client/services/client.service';
import { UserService } from '@finance/user/services/user.service';
import { SettingService } from '@finance/settings/services/setting.service';
import { LezoProjectService } from '@ext/lezo/services/lezo-project.service';
import { REGEXES } from '@resources';

@Component({
	selector	: 'dialog-create-project',
	templateUrl	: '../templates/dialog-create-project.pug',
})
export class DialogCreateProjectComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public projectForm: FormGroup;
	public isSubmitting: boolean;
	public clients: Array<any> = [];
	public project: any = {
		is_multi		: true,
		valid_duration	: 0,
	};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectService} projectService
	* @param {ClientService} clientService
	* @param {UserService} userService
	* @param {SettingService} settingService
	* @param {LezoProjectService} lezoProjectService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef			: MatDialogRef<DialogCreateProjectComponent>,
		public injector				: Injector,
		public fb					: FormBuilder,
		public snackBarService		: SnackBarService,
		public projectService		: ProjectService,
		public clientService		: ClientService,
		public userService			: UserService,
		public settingService		: SettingService,
		public lezoProjectService	: LezoProjectService
	) {
		super( injector );

		this.projectForm = fb.group({
			lezo_project_id: [
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
			client_id: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			manage_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			contact: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			valid_duration: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.min( 0 ),
					Validators.pattern( REGEXES.INT_NUMBER ),
				]),
			],
			sale_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			qs_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			purchase_by: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			construct_by	: [{ value: null, disabled: false }],
			is_multi		: [{ value: null, disabled: false }],
			project_time	: [{ value: null, disabled: false }],
			quotation_date	: [{ value: null, disabled: false }],
			address			: [{ value: null, disabled: false }],
			quotation_note	: [{ value: null, disabled: false }],
		});

		if ( this.isPM ) this.project.manage_by = this.account.id;
		if ( this.isSale ) this.project.sale_by = this.account.id;
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.initData();
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
	* Init all data
	* @return {void}
	*/
	public initData() {
		this.getSetting();
		this.getClients();
	}

	/**
	* Get all clients
	* @return {void}
	*/
	public getClients() {
		this.clientService
		.getAll( 'reference' )
		.subscribe( ( result: any ) => this.clients = result );
	}

	/**
	* Get setting
	* @return {void}
	*/
	public getSetting() {
		this.settingService
		.getAll( [ 'QUOTATION_WHT', 'QUOTATION_AGENCY_FEE', 'QUOTATION_NOTE' ] )
		.subscribe( ( result: any ) => {
			_.map( result, ( item: any ) => {
				switch ( item.key ) {
					case 'QUOTATION_WHT':
						this.project.wht = item.value;
						break;
					case 'QUOTATION_AGENCY_FEE':
						this.project.agency_fee = item.value;
						break;
					case 'QUOTATION_NOTE':
						this.project.quotation_note = item.value;
						break;
				}
			} );
		} );
	}

	/**
	* Create project
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.projectService
		.create({
			...this.project,
			project_start	: this.project.project_time && this.project.project_time.begin || null,
			project_end		: this.project.project_time && this.project.project_time.end || null,
		})
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'PROJECT_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_ALREADY_EXISTS', this.project );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_FAIL', this.project );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_SUCCESS', this.project );

			this.dialogRef.close( true );
		} );
	}

	/**
	* On Lezo project change
	* @param {any} ev
	* @return {boolean}
	*/
	public onLezoProjectChange( ev: any ) {
		if ( !ev ) return;

		this.project.name = ev.name;

		if ( !ev.client_id ) return;

		const client: any = _.findWhere( this.clients, { lezo_client_id: ev.client_id } );

		this.project.client_id = client.id;
		this.project.lezo_client_id = ev.client_id;
	}

}
