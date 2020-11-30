import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import {
	MatDialogRef, MAT_DIALOG_DATA
} from '@angular/material';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';
import { FormGroup, FormBuilder } from '@angular/forms';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { VOService } from '@finance/project/services/vo.service';
import {
	VO_APPROVE_STATUS, COLORS
} from '@resources';

@Component({
	selector		: 'dialog-vo-approver',
	templateUrl		: '../templates/dialog-vo-approver.pug',
})
export class DialogVOApproverComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public statusList: Array<any> = [
		{
			id		: VO_APPROVE_STATUS.WAITING_APPROVAL,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: VO_APPROVE_STATUS.APPROVED,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: VO_APPROVE_STATUS.REJECTED,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
	];

	public VO_APPROVE_STATUS: any = VO_APPROVE_STATUS;
	public voApproversForm: FormGroup;
	public voApprovers: any = {
		procurement_manager	: {},
		project_manager		: {},
		ceo					: {},
		sale				: {},
	};
	public loaded: boolean = true;
	public isSubmitting: boolean = false;

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {VOService} voService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef		: MatDialogRef<DialogVOApproverComponent>,
		public injector			: Injector,
		public fb				: FormBuilder,
		public snackBarService	: SnackBarService,
		public voService		: VOService
	) {
		super( injector );

		this.voApproversForm = fb.group({
			procurement_manager_status	: [{ value: null, disabled: false }],
			procurement_manager_comment	: [{ value: null, disabled: false }],
			project_manager_status		: [{ value: null, disabled: false }],
			project_manager_comment		: [{ value: null, disabled: false }],
			ceo_status					: [{ value: null, disabled: false }],
			ceo_comment					: [{ value: null, disabled: false }],
			sale_status					: [{ value: null, disabled: false }],
			sale_comment				: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.voApprovers, this.data );

		this.loaded = false;
		this.voService
		.getOne( this.data.id, 'approvers' )
		.subscribe( ( result: any ) => {
			this.loaded = true;

			if ( !result || !result.vo_approvers ) return;
			_.each( result.vo_approvers, ( item: any ) => {
				if ( this.account.role_key === item.role_key ) this.voApprovers.current_approver = item.id;

				switch ( item.role_key ) {
					case 'PROCUREMENT_MANAGER':
						this.voApprovers.procurement_manager.status = item.status;
						this.voApprovers.procurement_manager.comment = item.comment;
						this.voApprovers.procurement_manager.status_name = this.statusList[ this.voApprovers.procurement_manager.status ];

						if ( !item.user_id && this.isProcurementManager || this.account.id === item.user_id ) {
							this.voApprovers.procurement_manager.can_approve = true;
						}
						break;

					case 'PM':
						this.voApprovers.project_manager.status = item.status;
						this.voApprovers.project_manager.comment = item.comment;
						this.voApprovers.project_manager.status_name = this.statusList[ this.voApprovers.project_manager.status ];

						if ( !item.user_id && this.isPM || this.account.id === item.user_id ) {
							this.voApprovers.project_manager.can_approve = true;
						}
						break;

					case 'CEO':
						this.voApprovers.ceo.status = item.status;
						this.voApprovers.ceo.comment = item.comment;
						this.voApprovers.ceo.status_name = this.statusList[ this.voApprovers.ceo.status ];

						if ( !item.user_id && this.isCEO || this.account.id === item.user_id ) {
							this.voApprovers.ceo.can_approve = true;
						}
						break;

					case 'SALE':
						this.voApprovers.sale.status = item.status;
						this.voApprovers.sale.comment = item.comment;
						this.voApprovers.sale.status_name = this.statusList[ this.voApprovers.sale.status ];

						if ( !item.user_id && this.isSale || this.account.id === item.user_id ) {
							this.voApprovers.sale.can_approve = true;
						}
						break;
				}
			} );
		});
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
	* Update approve status per each user
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;
		const updateData: any = {
			user_id: this.account.id,
			vo_approver_id: this.voApprovers.current_approver,
		};

		if ( this.isProcurementManager ) {
			updateData.status = this.voApprovers.procurement_manager.status;
			updateData.comment = this.voApprovers.procurement_manager.comment;
		}

		if ( this.isPM ) {
			updateData.status = this.voApprovers.project_manager.status;
			updateData.comment = this.voApprovers.project_manager.comment;
		}

		if ( this.isCEO ) {
			updateData.status = this.voApprovers.ceo.status;
			updateData.comment = this.voApprovers.ceo.comment;
		}

		if ( this.isSale ) {
			updateData.status = this.voApprovers.sale.status;
			updateData.comment = this.voApprovers.sale.comment;
		}

		this.voService
		.approve( this.voApprovers.id, updateData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.VO_APPROVAL_FAIL', this.voApprovers );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.VO_APPROVAL_SUCCESS', this.voApprovers );

			this.dialogRef.close( true );
		} );
	}

}
