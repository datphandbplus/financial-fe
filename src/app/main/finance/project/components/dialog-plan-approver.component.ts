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
	selector	: 'dialog-plan-approver',
	templateUrl	: '../templates/dialog-plan-approver.pug',
})
export class DialogPlanApproverComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public planApproverForm: FormGroup;
	public isSubmitting: boolean;
	public planApprover: any = {};

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
		public dialogRef		: MatDialogRef<DialogPlanApproverComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public projectService	: ProjectService
	) {
		super( injector );

		this.planApproverForm = fb.group({
			comment: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.planApprover, this.data );
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
			status	: this.planApprover.status,
			comment	: this.planApprover.comment,
		};

		this.projectService
		.updatePlanStatus( this.planApprover.project.id, updateData, this.planApprover.type )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PLAN_FAIL', this.planApprover.project );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PLAN_SUCCESS', this.planApprover.project );
		} );

		this.dialogRef.close( true );
	}

}
