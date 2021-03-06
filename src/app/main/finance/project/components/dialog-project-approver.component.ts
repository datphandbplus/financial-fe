import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';

@Component({
	selector	: 'dialog-project-approver',
	templateUrl	: '../templates/dialog-project-approver.pug',
})
export class DialogProjectApproverComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public projectApproverForm: FormGroup;
	public isSubmitting: boolean;
	public projectApprover: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectService} projectService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogProjectApproverComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public projectService	: ProjectService
	) {
		super( injector );

		this.projectApproverForm = fb.group({
			comment: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.projectApprover, this.data );
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
	* Update project payment approver
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		const updateData: any = {
			quotation_status: this.projectApprover.quotation_status,
			comment			: this.projectApprover.comment,
		};

		this.projectService
		.updateQuotationStatus( this.projectApprover.project.id, updateData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_FAIL', this.projectApprover.project );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_SUCCESS', this.projectApprover.project );

			this.dialogRef.close( true );
		} );
	}

}
