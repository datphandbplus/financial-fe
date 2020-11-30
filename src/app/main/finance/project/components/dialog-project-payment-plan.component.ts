import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectPaymentPlanService } from '@finance/project/services/project-payment-plan.service';

@Component({
	selector	: 'dialog-project-payment-plan',
	templateUrl	: '../templates/dialog-project-payment-plan.pug',
})
export class DialogProjectPaymentPlanComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public projectPaymentPlanForm: FormGroup;
	public isSubmitting: boolean;
	public projectPaymentPlan: any = {
		project_id		: null,
		name			: null,
		note			: null,
		target_date		: null,
		target_percent	: null,
	};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectPaymentPlanService} projectPaymentPlanService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogProjectPaymentPlanComponent>,
		public injector					: Injector,
		public fb						: FormBuilder,
		public snackBarService			: SnackBarService,
		public projectPaymentPlanService: ProjectPaymentPlanService
	) {
		super( injector );

		this.projectPaymentPlanForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			target_date: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			target_percent: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
					Validators.max( 100 ),
				]),
			],
			note: { value: null, disabled: false },
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.projectPaymentPlan, this.data );
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

		this.projectPaymentPlanService
		.create( this.projectPaymentPlan )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result.message === 'PROJECT_PLAN_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_PLAN_OVER', this.projectPaymentPlan );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_PAYMENT_PLAN_FAIL', this.projectPaymentPlan );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_PAYMENT_PLAN_SUCCESS', this.projectPaymentPlan );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.projectPaymentPlanService
		.update( this.projectPaymentPlan.id, this.projectPaymentPlan )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result.message === 'PROJECT_PLAN_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_PLAN_OVER', this.projectPaymentPlan );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_PLAN_FAIL', this.projectPaymentPlan );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_PLAN_SUCCESS', this.projectPaymentPlan );

			this.dialogRef.close( true );
		} );
	}

}
