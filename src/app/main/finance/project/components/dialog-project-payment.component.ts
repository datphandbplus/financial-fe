import {
	Component, Inject, OnInit,
	OnDestroy, Injector, ViewChild,
	ElementRef, ViewEncapsulation
} from '@angular/core';
import {
	MatDialogRef, MAT_DIALOG_DATA,
	MatPaginator, MatTableDataSource
} from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectPaymentService } from '@finance/project/services/project-payment.service';
import { ProjectPaymentApproverService } from '@finance/project/services/project-payment-approver.service';
import { ProjectPurchaseOrderService } from '@finance/project/services/project-purchase-order.service';
import {
	PAYMENT_STATUS, COLORS, PROCEDURE_STATUS,
	PAYMENT_APPROVE_STATUS, TRANSFER_TYPE
} from '@resources';
import {TableUtil} from "@app/utils/tableUtils";
import {TranslateService} from "@ngx-translate/core";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector		: 'dialog-project-payment',
	templateUrl		: '../templates/dialog-project-payment.pug',
	styleUrls		: [ '../styles/dialog-project-bill.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
export class DialogProjectPaymentComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	@ViewChild( 'fileInput' ) public fileInput: ElementRef;

	@ViewChild( 'paginatorPOItem' ) set paginatorPOItem( paginator: MatPaginator ) {
		this.dataSourcePOItem.paginator = paginator;
	}

	public loaded: boolean;
	public paymentForm: FormGroup;
	public paymentInvoiceForm: FormGroup;
	public paymentStatusForm: FormGroup;
	public paymentFinanceNote: FormGroup;
	public procedureForm: FormGroup;
	public paymentApproverForm: FormGroup;
	public isSubmitting: boolean;
	public isUploading: boolean;
	public canEdit: boolean;
	public viewOnly: boolean;
	public canSubmit: boolean;
	public hasChange: boolean;
	public canUploadPaymentOrder: boolean;
	public uploadedPaymentOrderFile: any;
	public uploadedInvoiceFile: any;
	public selectedTabIndex: number = 0;
	public procedureIndex: number = -1;
	public remainingReal: number = 0;
	public remainingVATReal: number = 0;
	public minDate: any = moment();
	public minPaymentOrderDate: any = this.minDate.clone();
	public PAYMENT_STATUS: any = PAYMENT_STATUS;
	public PAYMENT_APPROVE_STATUS: any = PAYMENT_APPROVE_STATUS;
	public dataSourcePOItem: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public projectPurchaseOrder: any = {};
	public poDisplayedColumns: Array<string> = [
		'no', 'name', 'unit',
		'amount', 'price', 'total',
	];
	public payment: any = {
		new_invoice			: null,
		new_payment_order	: null,
		procedures			: [],
	};
	public procedureStatus: Array<any> = [
		{
			id		: 'WAITING',
			name	: 'FINANCE.PROJECT.LABELS.WAITING',
			color	: COLORS.WARNING,
			priority: 3,
		},
		{
			id		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.ACCENT,
			priority: 1,
		},
		{
			id		: 'CONFIRMED',
			name	: 'FINANCE.PROJECT.LABELS.CONFIRMED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 'DELAYED',
			name	: 'FINANCE.PROJECT.LABELS.DELAYED',
			color	: COLORS.WARN,
			priority: 2,
		},
	];
	public transferType: Array<any> = [
		{
			id	: TRANSFER_TYPE.CASH,
			name: 'FINANCE.PROJECT.LABELS.CASH',
		},
		{
			id	: TRANSFER_TYPE.BANKING_TRANSFER,
			name: 'FINANCE.PROJECT.LABELS.BANKING_TRANSFER',
		},
		{
			id	: TRANSFER_TYPE.OTHER,
			name: 'GENERAL.LABELS.OTHER',
		},
	];
	public displayedColumns: Array<string> = [
		'no', 'procedure', 'status',
		'deadline', 'document',
	];
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
	* @param {ProjectService} projectService
	* @param {ProjectPaymentService} projectPaymentService
	* @param {ProjectPaymentApproverService} projectPaymentApproverService
	* @param {ProjectPurchaseOrderService} projectPurchaseOrderService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef					: MatDialogRef<DialogProjectPaymentComponent>,
		public injector						: Injector,
		public fb							: FormBuilder,
		public snackBarService				: SnackBarService,
		public projectService				: ProjectService,
		public projectPaymentService		: ProjectPaymentService,
		public projectPaymentApproverService: ProjectPaymentApproverService,
		public projectPurchaseOrderService	: ProjectPurchaseOrderService,
		public translateService				: TranslateService,
		public excelService					: ExcelService
	) {
		super( injector );

		this.paymentForm = fb.group({
			payment_order_date: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			payment_order_number: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			payment_order_note	: [{ value: null, disabled: false }],
			invoice_note		: [{ value: null, disabled: false }],
			name				: [{ value: null, disabled: false }],
			total				: [{ value: null, disabled: false }],
			vat					: [{ value: null, disabled: false }],
			subtotal			: [{ value: null, disabled: false }],
			status				: [{ value: null, disabled: false }],
			transfer_type		: [{ value: null, disabled: false }],
		});

		this.paymentInvoiceForm = fb.group({
			invoice_number: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			invoice_date: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			invoice_note: [{ value: null, disabled: false }],
		});

		this.paymentStatusForm = fb.group({
			status: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.pattern(
						new RegExp( _.values( PAYMENT_STATUS ).join( '|' ) )
					),
				]),
			],
		});

		this.paymentFinanceNote = fb.group({
			finance_note: [{ value: null, disabled: false }],
		});

		this.procedureForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			status: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			deadline: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			note: [{ value: null, disabled: false }],
		});

		this.paymentApproverForm = fb.group({
			procurement_manager_status	: [{ value: null, disabled: false }],
			procurement_manager_comment	: [{ value: null, disabled: false }],
			general_accountant_status	: [{ value: null, disabled: false }],
			general_accountant_comment	: [{ value: null, disabled: false }],
			cfo_status					: [{ value: null, disabled: false }],
			cfo_comment					: [{ value: null, disabled: false }],
			total_real					: [{ value: null, disabled: false }],
			total_vat_real				: [{ value: null, disabled: false }],
			subtotal					: [{ value: null, disabled: false }],
		});
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.payment, this.data );
		this.canEdit = this.payment.status !== PAYMENT_STATUS.PAID
			&& this.payment.approve_status !== PAYMENT_APPROVE_STATUS.WAITING_APPROVAL;
		this.viewOnly = this.payment.approve_status === PAYMENT_APPROVE_STATUS.APPROVED || this.payment.is_freezed;

		if ( this.payment.invoice_date && this.payment.invoice_date.isValid() ) {
			this.payment.invoice_date = this.payment.invoice_date.format();
		} else {
			this.payment.invoice_date = null;
		}

		if ( this.payment.payment_order ) this.minPaymentOrderDate = moment( this.payment.payment_order );

		if ( !this.isCFO && !this.isLiabilitiesAccountant ) {
			this.paymentForm.get( 'payment_order_date' ).setValidators( null );
			this.paymentForm.get( 'payment_order_number' ).setValidators( null );
		}

		if ( !this.payment.procedures.length ) {
			this.payment.procedures.push({
				name		: null,
				status		: PROCEDURE_STATUS.WAITING,
				status_id	: null,
				deadline	: null,
				proof		: null,
				note		: null,
				file		: null,
				count_day	: 0,
			});
		}

		this.canUploadPaymentOrder = ( this.isCFO || this.isLiabilitiesAccountant )
			&& this.payment.status === PAYMENT_STATUS.CONFIRMED;

		_.each( this.payment.procedures, ( item: any, index: number ) => {
			item.temp_id = index;

			const currStatus: any = this.procedureStatus[ item.status ];

			item.status_name = currStatus;
			item.status_id = currStatus.id;
			item.status_priority = currStatus.priority;

			if ( item.deadline ) {
				const deadlineDate: any = moment( item.deadline );
				const fromDate: any = item.status_id === PROCEDURE_STATUS.CONFIRMED
					? moment( item.created_at )
					: this.minDate;

				item.count_day = deadlineDate.diff( fromDate.clone().startOf( 'd' ), 'd' );
			}
		} );

		this.selectedTabIndex = 0;

		if ( this.isProcurementManager || this.isGeneralAccountant || this.isCFO ) {
			this.selectedTabIndex = 2;
		}

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

		// Construction or Construction Manager
		if ( this.isConstruction || this.isConstructionManager ) {
			this.poDisplayedColumns.splice( -2 );
		}

		// Check approve status
		this.payment.approve_status !== PAYMENT_APPROVE_STATUS.WAITING_APPROVAL && ( this.canSubmit = false );

		// Get total PO
		!this.payment.is_freezed && this.getTotalPO();

		// Get project purchase order
		this.getProjectPurchaseOrder();

		this.dataSource.data = this.customSortDataSource( this.payment.procedures );
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
	* Click No button event
	* @return {void}
	*/
	public closeDiaglog() {
		this.dialogRef.close( true );
	}

	/**
	* Custom sort data source
	* @param {any} dataSourceClone
	* @return {array}
	*/
	public customSortDataSource( dataSourceClone: any ) {
		const data: Array<any> = _.clone( dataSourceClone );

		data.sort( ( a: any, b: any ) => b.status_priority - a.status_priority || a.count_day - b.count_day );

		return data;
	}

	/**
	* Update project payment invoice
	* @return {void}
	*/
	public updateInvoice() {
		this.isSubmitting = true;

		this.projectPaymentService
		.updateInvoice( this.payment.id, this.payment )
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

	/**
	* Update project payment order
	* @return {void}
	*/
	public updatePaymentOrder() {
		this.isSubmitting = true;

		this.projectPaymentService
		.updatePaymentOrder( this.payment.id, this.payment )
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

	/**
	* Update project payment status
	* @return {void}
	*/
	public updateStatus() {
		this.isSubmitting = true;

		this.projectPaymentService
		.updateStatus( this.payment.id, this.payment )
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

	/**
	* Update project payment finance note
	* @return {void}
	*/
	public updateFinanceNote() {
		this.isSubmitting = true;

		this.projectPaymentService
		.updateFinanceNote( this.payment.id, this.payment )
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

	/**
	* Update procedure
	* @return {void}
	*/
	public updateProcedure() {
		this.isSubmitting = true;
		this.hasChange = true;

		const procedureData: Array<any> = [];

		_.each( this.payment.procedures, ( item: any, index: number ) => {
			if ( item.created_at || index === this.procedureIndex ) {
				procedureData.push({
					name		: item.name,
					deadline	: item.deadline,
					status		: PROCEDURE_STATUS[ item.status_id ],
					proof		: item.proof,
					note		: item.note,
					created_at	: item.created_at || moment(),
				});
			}
		} );

		this.isSubmitting = false;

		this.projectPaymentService
		.updateProcedures( this.payment.id, procedureData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.payment );
				return;
			}

			const currProcedure: any = this.payment.procedures[ this.procedureIndex ];
			if ( !currProcedure.created_at ) currProcedure.created_at = moment();

			const currStatus: any = _.findWhere( this.procedureStatus, { id: currProcedure.status_id } );

			currProcedure.status_name = currStatus;
			currProcedure.status_priority = currStatus.priority;

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.payment );
		} );
	}

	/**
	* Handle upload invoice file
	* @param {any} event
	* @return {void}
	*/
	public onInvoiceFileSelected( event: any ) {
		this.isUploading = true;

		this.projectService
		.uploadInvoice( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

			if ( !result || !result.status ) {
				this.uploadedInvoiceFile = null;

				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_INVOICE_FAIL' );
				return;
			}

			this.uploadedInvoiceFile = result.data && result.data[ 0 ];
			this.payment.new_invoice = {
				location: this.uploadedInvoiceFile.location,
				path	: this.uploadedInvoiceFile.path,
				key		: this.uploadedInvoiceFile.key,
				note	: null,
			};
		} );
	}

	/**
	* Handle upload payment order file
	* @param {any} event
	* @return {void}
	*/
	public onPaymentOrderFileSelected( event: any ) {
		this.isUploading = true;

		this.projectService
		.uploadPaymentOrder( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

			if ( !result || !result.status ) {
				this.uploadedPaymentOrderFile = null;

				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_INVOICE_FAIL' );
				return;
			}

			this.uploadedPaymentOrderFile = result.data && result.data[ 0 ];
			this.payment.new_payment_order = {
				location: this.uploadedPaymentOrderFile.location,
				path	: this.uploadedPaymentOrderFile.path,
				key		: this.uploadedPaymentOrderFile.key,
				note	: null,
			};
		} );
	}

	/**
	* Handle upload procedure file
	* @param {any} event
	* @return {void}
	*/
	public onProcedureFileSelected( event: any ) {
		this.isUploading = true;

		this.projectService
		.uploadProcedure( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

			if ( !result || !result.status ) {
				if ( result && result.message === 'INVALID_FILE_TYPE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_TYPE' );
					return;
				}

				if ( result && result.message === 'INVALID_FILE_SIZE' ) {
					this.snackBarService.warning( 'FORM_ERROR_MESSAGES.INVALID_FILE_SIZE' );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPLOAD_INVOICE_FAIL' );
				return;
			}

			const currProcedure: any = this.payment.procedures[ this.procedureIndex ];

			currProcedure.file = result.data && result.data[ 0 ];
			this.payment.procedures[ this.procedureIndex ].proof = {
				location	: currProcedure.file.location,
				path		: currProcedure.file.path,
				key			: currProcedure.file.key,
				originalname: currProcedure.file.originalname,
				size		: currProcedure.file.size,
			};
		} );
	}

	/**
	* Download invoice
	* @param {any} key - Key attachment to download
	* @param {any} url - Url attachment to download
	* @return {void}
	*/
	public downloadInvoice( key: string, url: string ) {
		const data: any = { key, url };

		this.projectPaymentService
		.downloadInvoice( data )
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_INVOICE_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

	/**
	* Download payment order
	* @param {any} key - Key attachment to download
	* @param {any} url - Url attachment to download
	* @return {void}
	*/
	public downloadPaymentOrder( key: string, url: string ) {
		const data: any = { key, url };

		this.projectPaymentService
		.downloadPaymentOrder( data )
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_PAYMENT_ORDER_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

	/**
	* Download procedure
	* @param {any} key - Key attachment to download
	* @param {any} url - Url attachment to download
	* @return {void}
	*/
	public downloadProcedure( key: string, url: string ) {
		const data: any = { key, url };

		this.projectPaymentService
		.downloadProcedure( data )
		.subscribe( ( result: any ) => {
			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DOWNLOAD_PROCEDURE_FAIL' );
				return;
			}

			const win: any = window.open( result.data, '_blank' );
			win.focus();
		} );
	}

	/**
	* Add procedure
	* @return {void}
	*/
	public addProcedure() {
		const currStatus: any = this.procedureStatus[ PROCEDURE_STATUS.WAITING ];

		this.payment.procedures.push({
			temp_id			: this.payment.procedures.length,
			name			: null,
			status			: PROCEDURE_STATUS.WAITING,
			deadline		: null,
			proof			: null,
			note			: null,
			file			: null,
			status_name		: currStatus,
			status_id		: currStatus.id,
			status_priority	: currStatus.priority,
		});

		this.procedureIndex = this.payment.procedures.length - 1;
		this.dataSource.data = this.customSortDataSource( this.payment.procedures );
	}

	/**
	* Add procedure
	* @param {number} index
	* @return {void}
	*/
	public backToProcedureList() {
		this.procedureIndex = -1;

		this.dataSource.data = this.customSortDataSource( this.payment.procedures );
	}

	/**
	* Can upload invoice
	* @return {boolean}
	*/
	get canUploadInvoice(): boolean {
		return !this.isCFO && !this.isLiabilitiesAccountant && this.payment.status === PAYMENT_STATUS.WAITING;
	}

	/**
	* Update project payment approver status
	* @return {void}
	*/
	public updatePaymentApproveStatus() {
		this.isSubmitting = true;

		const updateData: any = {};

		if ( this.isProcurementManager ) {
			updateData.status = this.approvers.procurement_manager.status;
			updateData.comment = this.approvers.procurement_manager.comment;

			updateData.total_real = 0;
			updateData.total_vat_real = 0;

			if ( this.approvers.procurement_manager.status === PAYMENT_APPROVE_STATUS.APPROVED ) {
				updateData.total_real = this.payment.total_real;
				updateData.total_vat_real = this.payment.total_vat_real;
			}
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
				if ( result.message === 'PROJECT_PAYMENT_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PROJECT_PAYMENT_OVER', this.payment );
					return;
				}

				if ( result.message === 'PROJECT_PAYMENT_VAT_OVER' ) {
					this.snackBarService.warning( 'FINANCE.PROJECT.MESSAGES.PAYMENT_VAT_OVER', this.payment );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_FAIL', this.payment );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_PAYMENT_SUCCESS', this.payment );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Appove status change
	* @param {any} event
	* @return {void}
	*/
	public approveStatusChange( event: any ) {
		if ( !event || !event.source ) return;

		const totalRealControl: any = this.paymentApproverForm.get( 'total_real' );
		const totalVATRealControl: any = this.paymentApproverForm.get( 'total_vat_real' );

		if ( event.value === PAYMENT_APPROVE_STATUS.APPROVED ) {
			totalRealControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.remainingReal ),
			]);

			totalVATRealControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.remainingVATReal ),
			]);
		} else {
			totalRealControl.setValidators([]);
			totalVATRealControl.setValidators([]);
		}

		totalRealControl.updateValueAndValidity();
		totalVATRealControl.updateValueAndValidity();
	}

	/**
	* Get total purchase order
	* @return {void}
	*/
	public getTotalPO() {
		this.loaded = false;

		this.projectPaymentService
		.getTotalPO( this.payment.id, this.payment.project_id, this.payment.project_purchase_order_id )
		.subscribe( ( result: any ) => {
			this.loaded = true;
			const data: any = result.data;

			this.remainingReal = Math.max( 0, data.total - data.total_real + this.payment.total_real );
			this.remainingVATReal = Math.max( 0, data.total_vat - data.total_vat_real + this.payment.total_vat_real );

			const totalRealControl: any = this.paymentApproverForm.get( 'total_real' );
			const totalVATRealControl: any = this.paymentApproverForm.get( 'total_vat_real' );

			totalRealControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.remainingReal ),
			]);

			totalVATRealControl.setValidators([
				Validators.required,
				Validators.min( 0 ),
				Validators.max( this.remainingVATReal ),
			]);

			totalRealControl.updateValueAndValidity();
			totalVATRealControl.updateValueAndValidity();

			if ( this.isProcurementManager && this.approvers.procurement_manager.status === PAYMENT_APPROVE_STATUS.WAITING_APPROVAL ) {
				this.payment.total_real = Math.min( this.payment.total, this.remainingReal );
				this.payment.total_vat_real = Math.min( this.payment.total_vat, this.remainingVATReal );
			}
		} );
	}

	/**
	* Get project purchase order
	* @return {void}
	*/
	public getProjectPurchaseOrder() {
		this.loaded = false;

		this.projectPurchaseOrderService
		.getOne( this.payment.project_purchase_order_id, this.payment.project_id )
		.subscribe( ( result: any ) => {
			this.loaded = true;

			let tempTotal: number = 0;

			_.each( result.project_cost_items, ( item: any ) => {
				item.total = item.amount * item.price;
				tempTotal += item.total;
			} );

			this.projectPurchaseOrder = result;
			this.projectPurchaseOrder.total = tempTotal;
			this.projectPurchaseOrder.discount_value = this.projectPurchaseOrder.discount_type === '$'
				? this.projectPurchaseOrder.discount_amount
				: this.projectPurchaseOrder.discount_amount * tempTotal / 100;
			this.projectPurchaseOrder.total_remain = tempTotal - this.projectPurchaseOrder.discount_value;

			this.dataSourcePOItem.data = result.project_cost_items;

		} );
	}

	private exportPaymentInfo() {
		const title = 'Payment Info';
		const sheetName = (this.data.po_name || 'info').toString().toUpperCase();
		const fileName = `Payment_Info_${TableUtil.slug(this.data.po_name || '')}`;
		const infoData = {
			data: [
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('GENERAL.LABELS.NAME') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: this.payment.name || ''
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: TableUtil.getNumberFormatForExcel(this.payment.total || 0)
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('GENERAL.LABELS.VAT') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: TableUtil.getNumberFormatForExcel(this.payment.total_vat || 0)
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.SUBTOTAL') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: TableUtil.getNumberFormatForExcel((this.payment.total || 0) + (this.payment.total_vat || 0))
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.TRANSFER_TYPE') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: this.translateService.instant(this.transferType[this.payment.transfer_type || 0].name)
						}
					]
				}
			],
			cols: 2
		};
		this.excelService.exportNormalViewToExcel(infoData, title, sheetName, fileName);
	}

	public exportProcedure() {
		const headerSetting = {
			header: [
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('GENERAL.ATTRIBUTES.STATUS'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.DEADLINE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PROOF')
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'cost'}),
			fgColor: 'ffffff',
			bgColor: '00245A',
			widths: [50, 30, 15, 15, 20, 20, 50]
		};
		const title = 'Procedure';
		const sheetName = (this.data.po_name || 'info').toString().toUpperCase();
		const fileName = `Procedure_${TableUtil.slug(this.data.po_name || '')}`;
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			dataItem.push(item.name || 'N/A');
			const status = (item.status_name && item.status_name.name) ? {value: this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
			dataItem.push(status);
			dataItem.push((item.deadline) ? TableUtil.getDateFormatForExcel(new Date(item.deadline)) : '');
			dataItem.push((item.proof && item.proof.key) ? item.proof.key : '');
			exportData.push(dataItem);
		});
		this.excelService.exportArrayToExcel(
			exportData,
			title,
			headerSetting,
			sheetName,
			fileName
		);
	}

	public exportPaymentPO() {
		const infoData = {
			data: [
				{
					title: this.translateService.instant('FINANCE.COST_ITEM.LABELS.PURCHASE_ORDER'),
					value: this.projectPurchaseOrder.name || 'N/A'
				},
				{
					title: this.translateService.instant('FINANCE.VENDOR.ATTRIBUTES.VENDOR'),
					value: ( this.projectPurchaseOrder.vendor && this.projectPurchaseOrder.vendor.short_name ) ? this.projectPurchaseOrder.vendor.short_name : 'N/A'
				}
			],
			cols: 2
		};
		const headerSetting = {
			header: [
				this.translateService.instant('GENERAL.ATTRIBUTES.NUMBER_ORDER'),
				this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
				this.translateService.instant('GENERAL.ATTRIBUTES.UNIT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.AMOUNT'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PRICE'),
				this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL')
			],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'po'}),
			fgColor: 'ffffff',
			bgColor: '00245A',
			widths: [50, 30, 15, 15, 20, 20, 50]
		};
		const title = 'PO Details';
		const sheetName = (this.data.po_name || 'info').toString().toUpperCase();
		const fileName = `PO_Details_${TableUtil.slug(this.data.po_name || '')}`;
		const exportDataPO: any[] = [];
		this.dataSourcePOItem.data.forEach((item: any, i: number) => {
			const dataItem: any[] = [];

			dataItem.push(TableUtil.pad(i + 1, 2));
			dataItem.push(item.name || 'N/A');
			dataItem.push(item.unit || 'N/A');
			dataItem.push(item.amount ? TableUtil.pad(item.amount, 2) : 0);
			dataItem.push(TableUtil.getNumberFormatForExcel(item.price || 0));
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total || 0));
			exportDataPO.push(dataItem);
		});
		const extraDataPO = [
			{
				title: this.translateService.instant('FINANCE.PROJECT.LABELS.SUM'),
				value: TableUtil.getNumberFormatForExcel(this.projectPurchaseOrder.total || 0),
				fgColors: ['38AE00', 'FD8631']
			},
			{
				title: this.translateService.instant('FINANCE.PROJECT.LABELS.DISCOUNT_VALUE'),
				value: TableUtil.getNumberFormatForExcel(this.projectPurchaseOrder.discount_value || 0),
				fgColors: ['38AE00', 'FD8631']
			},
			{
				title: this.translateService.instant('FINANCE.PROJECT.LABELS.SUM_DISCOUNT'),
				value: TableUtil.getNumberFormatForExcel(this.projectPurchaseOrder.total_remain || 0),
				fgColors: ['38AE00', 'FD8631']
			},
			{
				title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.VAT'),
				value: TableUtil.getNumberFormatForExcel((this.projectPurchaseOrder.total_remain || 0) * (this.projectPurchaseOrder.vat_percent || 0) / 100),
				fgColors: ['38AE00', 'FD8631']
			},
			{
				title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL_INCLUDED_VAT'),
				value: TableUtil.getNumberFormatForExcel((this.projectPurchaseOrder.total_remain || 0) * (1 + (this.projectPurchaseOrder.vat_percent || 0) / 100)),
				fgColors: ['38AE00', 'FD8631']
			}
		];
		this.excelService.exportArrayToExcel(
			exportDataPO,
			title,
			headerSetting,
			sheetName,
			fileName,
			extraDataPO,
			infoData
		);
	}

	public exportExcel() {
		if (this.selectedTabIndex === 0) {
			this.exportPaymentInfo();
		} else if (this.selectedTabIndex === 1) {
			this.exportProcedure();
		} else if (this.selectedTabIndex === 3) {
			this.exportPaymentPO();
		}

		this.dialogRef.close('');
	}

}
