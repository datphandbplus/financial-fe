import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { SheetService } from '@finance/project/services/sheet.service';

@Component({
	selector	: 'dialog-sheet',
	templateUrl	: '../templates/dialog-sheet.pug',
})
export class DialogSheetComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public sheetForm: FormGroup;
	public isSubmitting: boolean;
	public sheet: any = {
		project_id	: null,
		name		: null,
		description	: null,
		note		: null,
	};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {SheetService} sheetService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogSheetComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public sheetService		: SheetService
	) {
		super( injector );

		this.sheetForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			description	: { value: null, disabled: false },
			note		: { value: null, disabled: false },
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.sheet, this.data );

		if ( !this.sheet.user || this.sheet.user.is_disabled ) this.sheet.manage_by = null;
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
	* Create project
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.sheetService
		.create( this.sheet )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_SHEET_FAIL', this.sheet );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_SHEET_SUCCESS', this.sheet );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.sheetService
		.update( this.sheet.id, this.sheet )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SHEET_FAIL', this.sheet );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SHEET_SUCCESS', this.sheet );

			this.dialogRef.close( true );
		} );
	}

}
