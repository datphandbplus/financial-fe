import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectPaymentApproverService } from '@finance/project/services/project-payment-approver.service';
import { PAYMENT_APPROVE_STATUS, COLORS } from '@resources';

@Component({
	selector	: 'dialog-project-payment-approver',
	templateUrl	: '../templates/dialog-project-payment-approver.pug',
})
export class DialogProjectPaymentApproverComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public paymentApproverForm: FormGroup;
	public isSubmitting: boolean;
	public canSubmit: boolean;
	public payment: any = {};
	public PAYMENT_APPROVE_STATUS: any = PAYMENT_APPROVE_STATUS;
	public approvers: any = {
		procurement_manager	: {},
		general_accountant	: {},
		cfo					: {},
	};
	public statusList: Array<any> = [
		{
			id		: PAYMENT_APPROVE_STATUS.WAITING_APPROVAL,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: PAYMENT_APPROVE_STATUS.APPROVED,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: PAYMENT_APPROVE_STATUS.REJECTED,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
	];

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {ProjectPaymentApproverService} projectPaymentApproverService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef					: MatDialogRef<DialogProjectPaymentApproverComponent>,
		public injector						: Injector,
		public fb							: FormBuilder,
		public snackBarService				: SnackBarService,
		public projectPaymentApproverService: ProjectPaymentApproverService
	) {
		super( injector );

		this.paymentApproverForm = fb.group({
			procurement_manager_status	: [{ value: null, disabled: false }],
			procurement_manager_comment	: [{ value: null, disabled: false }],
			general_accountant_status	: [{ value: null, disabled: false }],
			general_accountant_comment	: [{ value: null, disabled: false }],
			cfo_status					: [{ value: null, disabled: false }],
			cfo_comment					: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.payment, this.data );

		_.each( this.payment.approvers, ( item: any ) => {
			switch ( item.role_key ) {
				case 'PROCUREMENT_MANAGER':
					this.approvers.procurement_manager.status = item.status;
					this.approvers.procurement_manager.comment = item.comment;
					this.approvers.procurement_manager.status_name = _.findWhere( this.statusList, { id: item.status } );

					if ( this.account.role_key === item.role_key ) {
						this.approvers.procurement_manager.can_approve = true;
						this.canSubmit = true;
					}
					break;

				case 'GENERAL_ACCOUNTANT':
					this.approvers.general_accountant.status = item.status;
					this.approvers.general_accountant.comment = item.comment;
					this.approvers.general_accountant.status_name = _.findWhere( this.statusList, { id: item.status } );

					if ( this.account.role_key === item.role_key ) {
						this.approvers.general_accountant.can_approve = true;
						this.canSubmit = true;
					}
					break;

				case 'CFO':
					this.approvers.cfo.status = item.status;
					this.approvers.cfo.comment = item.comment;
					this.approvers.cfo.status_name = _.findWhere( this.statusList, { id: item.status } );

					if ( this.account.role_key === item.role_key ) {
						this.approvers.cfo.can_approve = true;
						this.canSubmit = true;
					}
					break;
			}
		} );

		// Procurement Manager need approve first
		if ( ( this.isGeneralAccountant || this.isCFO )
			&& this.approvers.procurement_manager.status !== PAYMENT_APPROVE_STATUS.APPROVED ) {
			this.approvers.general_accountant.can_approve = false;
			this.approvers.cfo.can_approve = false;
			this.canSubmit = false;
		}
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

		const updateData: any = {};

		if ( this.isProcurementManager ) {
			updateData.status = this.approvers.procurement_manager.status;
			updateData.comment = this.approvers.procurement_manager.comment;
		}

		if ( this.isGeneralAccountant ) {
			updateData.status = this.approvers.general_accountant.status;
			updateData.comment = this.approvers.general_accountant.comment;
		}

		if ( this.isCFO ) {
			updateData.status = this.approvers.cfo.status;
			updateData.comment = this.approvers.cfo.comment;
		}

		this.projectPaymentApproverService
		.update( this.payment.id, updateData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_FAIL', this.payment );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_SUCCESS', this.payment );

			this.dialogRef.close( true );
		} );
	}

}
