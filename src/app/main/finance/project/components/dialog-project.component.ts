import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ClientService } from '@finance/client/services/client.service';
import { UserService } from '@finance/user/services/user.service';
import { REGEXES } from '@resources';

@Component({
	selector	: 'dialog-project',
	templateUrl	: '../templates/dialog-project.pug',
})
export class DialogProjectComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public projectForm: FormGroup;
	public isSubmitting: boolean;
	public project: any = { valid_duration: 0 };
	public clients: Array<any> = [];

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
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogProjectComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public projectService	: ProjectService,
		public clientService	: ClientService,
		public userService		: UserService
	) {
		super( injector );

		this.projectForm = fb.group({
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
			project_time	: [{ value: null, disabled: false }],
			quotation_date	: [{ value: null, disabled: false }],
			address			: [{ value: null, disabled: false }],
			quotation_note	: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.project, this.data );

		if ( !this.project.user || this.project.user.is_disabled ) this.project.manage_by = null;
		if ( !this.project.client || this.project.client.is_disabled ) this.project.client_id = null;

		if ( this.project.project_start && this.project.project_end ) {
			this.project.project_time = {
				begin	: this.project.project_start,
				end		: this.project.project_end,
			};
		}

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
	* Update project
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.projectService
		.update(
			this.project.id,
			{
				...this.project,
				project_start	: this.project.project_time && this.project.project_time.begin || null,
				project_end		: this.project.project_time && this.project.project_time.end || null,
			}
		)
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'PROJECT_ALREADY_EXISTS' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_ALREADY_EXISTS', this.project );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_FAIL', this.project );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SUCCESS', this.project );

			this.dialogRef.close( true );
		} );
	}

}
