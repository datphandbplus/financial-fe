import {
	Component, Inject, OnInit,
	OnDestroy, Injector, ViewChild,
	ElementRef, ViewEncapsulation
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectBillService } from '@finance/project/services/project-bill.service';
import { ProjectLineItemService } from '@finance/project/services/project-line-item.service';
import { VOService } from '@finance/project/services/vo.service';
import { DialogConfirmComponent } from '@core';
import {
	DISCOUNT_STATUS, BILL_STATUS, COLORS,
	PROCEDURE_STATUS, TRANSFER_TYPE
} from '@resources';
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector		: 'dialog-project-bill',
	templateUrl		: '../templates/dialog-project-bill.pug',
	styleUrls		: [ '../styles/dialog-project-bill.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
export class DialogProjectBillComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	@ViewChild( 'fileInput' ) public fileInput: ElementRef;

	public maxDate: Date;
	public loaded: boolean;
	public billForm: FormGroup;
	public billInvoiceForm: FormGroup;
	public billStatusForm: FormGroup;
	public billFinanceNote: FormGroup;
	public procedureForm: FormGroup;
	public isSubmitting: boolean;
	public isUploading: boolean;
	public hasChange: boolean;
	public canUploadInvoice: boolean;
	public viewOnly: boolean;
	public uploadedFile: any;
	public totalBill: number = 0;
	public totalBillVAT: number = 0;
	public remaining: number = 0;
	public remainingVAT: number = 0;
	public remainingReal: number = 0;
	public remainingVATReal: number = 0;
	public selectedTabIndex: number = 0;
	public procedureIndex: number = -1;
	public minDate: any = moment();
	public BILL_STATUS: any = BILL_STATUS;
	public PROCEDURE_STATUS: any = PROCEDURE_STATUS;
	public RATIO: Array<number> = _.range( 0, 105, 5 );
	public ratioPercent: number = this.RATIO[ 2 ]; // 10%
	public vatPercent: number = this.RATIO[ 2 ]; // 10%
	public bill: any = {
		total			: 0,
		total_vat		: 0,
		status			: 0, // Pending
		new_invoice		: null,
		procedures		: [],
		transfer_type	: TRANSFER_TYPE.CASH,
		total_real		: 0,
		total_vat_real	: 0,
		total_real_change: 0,
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

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {MatDialog} dialog
	* @param {Injector} injector
	* @param {FormBuilder} fb
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {ProjectService} projectService
	* @param {ProjectBillService} projectBillService
	* @param {ProjectLineItemService} projectLineItemService
	* @param {VOService} voService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef				: MatDialogRef<DialogProjectBillComponent>,
		public dialog					: MatDialog,
		public injector					: Injector,
		public fb						: FormBuilder,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public excelService				: ExcelService,
		public projectService			: ProjectService,
		public projectBillService		: ProjectBillService,
		public projectLineItemService	: ProjectLineItemService,
		public voService				: VOService
	) {
		super( injector );

    	this.maxDate = new Date();

		this.billForm = fb.group({
			name: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.minLength( 1 ),
					Validators.maxLength( 255 ),
				]),
			],
			total: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 1 ),
				]),
			],
			vat_percent: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.min( 0 ),
					Validators.max( 100 ),
				]),
			],
			total_vat: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.min( 0 ),
				]),
			],
			expected_invoice_date: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
				]),
			],
			ratio			: [{ value: null, disabled: false }],
			subtotal		: [{ value: null, disabled: false }],
			transfer_type	: [{ value: null, disabled: false }],
		});

		this.billInvoiceForm = fb.group({
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

		this.billStatusForm = fb.group({
			status: [
				{ value: null, disabled: false },
				Validators.compose([
					Validators.required,
					Validators.pattern(
						new RegExp( _.values( BILL_STATUS ).join( '|' ) )
					),
				]),
			],
			total_real		: [{ value: null, disabled: false }],
			total_vat_real	: [{ value: null, disabled: false }],
			received_date	: [{ value: null, disabled: false }],
			subtotal		: [{ value: null, disabled: false }],
		});

		this.billFinanceNote = fb.group({
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
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.bill, JSON.parse( JSON.stringify( this.data ) ) );
		this.viewOnly = this.data.status === BILL_STATUS.MONEY_COLLECTED;

		if (!this.bill.received_date) {
			this.bill.received_date = new Date();
		} else {
			this.bill.received_date = new Date(this.bill.received_date);
		}

		if ( this.bill.expected_invoice_date ) {
			const expectedInvoiceDate: any = moment( this.bill.expected_invoice_date );
			this.bill.expected_invoice_date = expectedInvoiceDate.format();
		}

		if ( !this.bill.procedures.length ) {
			this.bill.procedures.push({
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

		_.each( this.bill.procedures, ( item: any, index: number ) => {
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

		this.canUploadInvoice = ( this.isLiabilitiesAccountant || this.isCFO )
			&& this.bill.status === BILL_STATUS.PROCESSING;

		this.dataSource.data = this.customSortDataSource( this.bill.procedures );

		this.getTotalBill();

		this.bill.total_real = this.viewOnly ? this.data.total_real : this.data.total ;
		this.bill.total_vat_real = this.viewOnly ? this.data.total_vat_real : this.data.total_vat ;
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
	* Get total bill
	* @return {void}
	*/
	public getTotalBill() {
		this.loaded = false;

		this.projectLineItemService
		.getAll( 'total', { project_id: this.bill.project_id } )
		.subscribe( ( result: any ) => {
			_.each( result, ( item: any ) => {
				if ( item.discount_amount && item.discount_status === DISCOUNT_STATUS.CONFIRMED ) {
					const discountMoney: number = item.discount_type === '$'
						? item.discount_amount
						: item.total * item.discount_amount / 100;

					this.totalBill += item.total - discountMoney;
				} else {
					this.totalBill += item.amount * item.price;
				}
			} );

			// Get total VO Quotation
			this.voService
			.getSumQuotation( this.bill.project_id )
			.subscribe( ( vo: any ) => {
				this.loaded = true;

				this.totalBill += vo.total;
				this.totalBillVAT = this.totalBill * 0.1 + vo.vat;

				this.remaining = Math.max( 0, this.totalBill - this.bill.total_planed + ( this.bill.id ? this.bill.total : 0 ) );
				this.remainingVAT = Math.max( 0, this.totalBillVAT - this.bill.total_vat_planed + ( this.bill.id ? this.bill.total_vat : 0 ) );
				this.remainingReal = Math.max( 0, this.totalBill - this.bill.all_total_real );
				this.remainingVATReal = Math.max( 0, this.totalBillVAT - this.bill.all_total_vat_real );

				!this.bill.id && this.updateTotal();

				const totalControl: any = this.billForm.get( 'total' );
				const totalVATControl: any = this.billForm.get( 'total_vat' );

				totalControl.setValidators([
					Validators.required,
					Validators.min( 0 ),
					Validators.max( this.remaining ),
				]);

				totalVATControl.setValidators([
					Validators.required,
					Validators.min( 0 ),
					Validators.max( this.remainingVAT ),
				]);

				totalControl.updateValueAndValidity();
				totalVATControl.updateValueAndValidity();
			} );
		} );
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
	* Update total
	* @return {void}
	*/
	public updateTotal() {
		if ( !this.remaining ) return;

		// const tempTotal: number = this.totalBill * this.ratioPercent / 100;

		// this.bill.total = tempTotal > this.remaining ? this.remaining : tempTotal;
		this.updateVAT();
	}

	/**
	* Update total
	* @return {void}
	*/
	public updateVAT() {
		if ( !this.bill.total ) {
			this.bill.total_vat = 0;
			return;
		}
		this.bill.total_vat = this.bill.total * this.vatPercent / 100;
	}

	/**
	* Create project bill
	* @return {void}
	*/
	public create() {
		this.isSubmitting = true;

		this.projectBillService
		.create( this.bill )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'PROJECT_BILL_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_OVER', this.bill );
					return;
				}

				if ( result && result.message === 'PROJECT_BILL_VAT_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_VAT_OVER', this.bill );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.CREATE_PROJECT_BILL_SUCCESS', this.bill );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project bill
	* @return {void}
	*/
	public update() {
		this.isSubmitting = true;

		this.projectBillService
		.update( this.bill.id, this.bill )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'PROJECT_BILL_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_OVER', this.bill );
					return;
				}

				if ( result && result.message === 'PROJECT_BILL_VAT_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_VAT_OVER', this.bill );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.bill );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project bill invoice
	* @return {void}
	*/
	public updateInvoice() {
		this.isSubmitting = true;

		this.projectBillService
		.updateInvoice( this.bill.id, this.bill )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.bill );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project bill status with confirm
	* @return {void}
	*/
	public updateStatus() {
		// Update status only
		if ( this.bill.status !== BILL_STATUS.MONEY_COLLECTED ) {
			this._updateStatus();
			return;
		}

		// Update status width total real
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.CONFIRM_BILL' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.BILL_TOTAL_CONFIRMATION', this.bill ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this._updateStatus();
		} );
	}

	/**
	* Update project bill status
	* @return {void}
	*/
	public _updateStatus() {
		this.isSubmitting = true;

		this.projectBillService
		.updateStatus( this.bill.id, this.bill )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				if ( result && result.message === 'PROJECT_BILL_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_OVER', this.bill );
					return;
				}

				if ( result && result.message === 'PROJECT_BILL_VAT_OVER' ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.PROJECT_BILL_VAT_OVER', this.bill );
					return;
				}

				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.bill );

			this.dialogRef.close( true );
		} );
	}

	/**
	* Update project bill finance note
	* @return {void}
	*/
	public updateFinanceNote() {
		this.isSubmitting = true;

		this.projectBillService
		.updateFinanceNote( this.bill.id, this.bill )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.bill );

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

		_.each( this.bill.procedures, ( item: any, index: number ) => {
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

		this.projectBillService
		.updateProcedures( this.bill.id, procedureData )
		.subscribe( ( result: any ) => {
			this.isSubmitting = false;

			if ( !result || !result.status ) {
				this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_FAIL', this.bill );
				return;
			}

			const currProcedure: any = this.bill.procedures[ this.procedureIndex ];
			if ( !currProcedure.created_at ) currProcedure.created_at = moment();

			const currStatus: any = _.findWhere( this.procedureStatus, { id: currProcedure.status_id } );

			currProcedure.status_name = currStatus;
			currProcedure.status_priority = currStatus.priority;

			this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.UPDATE_PROJECT_BILL_SUCCESS', this.bill );
		} );
	}

	/**
	* Handle upload invoice file
	* @param {any} event
	* @return {void}
	*/
	public onFileSelected( event: any ) {
		this.isUploading = true;

		this.projectService
		.uploadInvoice( event.file )
		.subscribe( ( result: any ) => {
			this.isUploading = false;
			event.input.nativeElement.value = null;

			if ( !result || !result.status ) {
				this.uploadedFile = null;

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

			this.uploadedFile = result.data && result.data[ 0 ];
			this.bill.new_invoice = {
				location: this.uploadedFile.location,
				path	: this.uploadedFile.path,
				key		: this.uploadedFile.key,
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

			const currProcedure: any = this.bill.procedures[ this.procedureIndex ];

			currProcedure.file = result.data && result.data[ 0 ];
			this.bill.procedures[ this.procedureIndex ].proof = {
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

		this.projectBillService
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
	* Add procedure
	* @return {void}
	*/
	public addProcedure() {
		const currStatus: any = this.procedureStatus[ PROCEDURE_STATUS.WAITING ];

		this.bill.procedures.push({
			temp_id			: this.bill.procedures.length,
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

		this.procedureIndex = this.bill.procedures.length - 1;
		this.dataSource.data = this.customSortDataSource( this.bill.procedures );
	}

	/**
	* Add procedure
	* @param {number} index
	* @return {void}
	*/
	public backToProcedureList() {
		this.procedureIndex = -1;

		this.dataSource.data = this.customSortDataSource( this.bill.procedures );
	}

	/**
	* Download procedure
	* @param {any} key - Key attachment to download
	* @param {any} url - Url attachment to download
	* @return {void}
	*/
	public downloadProcedure( key: string, url: string ) {
		const data: any = { key, url };

		this.projectBillService
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
	* Bill status change
	* @param {any} event
	* @return {void}
	*/
	public billStatusChange( event: any ) {
		if ( !event || !event.source ) return;

		const totalRealControl: any = this.billStatusForm.get( 'total_real' );
		const totalVATRealControl: any = this.billStatusForm.get( 'total_vat_real' );
		const receivedDateControl: any = this.billStatusForm.get( 'received_date' );

		if ( event.value === BILL_STATUS.MONEY_COLLECTED ) {
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

			receivedDateControl.setValidators([
				Validators.required,
			]);
		} else {
			totalRealControl.setValidators([]);
			totalVATRealControl.setValidators([]);
			receivedDateControl.setValidators([]);
		}

		// totalRealControl.updateValueAndValidity();
		// totalVATRealControl.updateValueAndValidity();
		// receivedDateControl.updateValueAndValidity();
	}

	private exportBillInfo() {
		const title = 'Bill Info';
		const sheetName = (this.data.po_name || 'info').toString().toUpperCase();
		const fileName = `Bill_Info_${TableUtil.slug(this.data.po_name || '')}`;
		let bill_status = '';
		if (this.bill.status === BILL_STATUS.WAITING) {
			bill_status = this.translateService.instant('FINANCE.PROJECT.LABELS.WAITING');
		} else if (this.bill.status === BILL_STATUS.PROCESSING) {
			bill_status = this.translateService.instant('FINANCE.PROJECT.LABELS.PROCESSING');
		} else if (this.bill.status === BILL_STATUS.INVOICE_SENT) {
			bill_status = this.translateService.instant('FINANCE.PROJECT.LABELS.INVOICE_SENT');
		} else {
			bill_status = this.translateService.instant('FINANCE.PROJECT.LABELS.MONEY_COLLECTED');
		}
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
							text: this.bill.name || ''
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.EXPECTED_INVOICE_DATE') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: this.bill.expected_invoice_date ? TableUtil.getDateFormatForExcel(new Date(this.bill.expected_invoice_date)) : ''
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
							text: TableUtil.getNumberFormatForExcel(this.bill.total || 0)
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
							text: TableUtil.getNumberFormatForExcel(this.bill.total_vat || 0)
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
							text: this.translateService.instant(this.transferType[this.bill.transfer_type || 0].name)
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
							text: TableUtil.getNumberFormatForExcel((this.bill.total || 0) + (this.bill.total_vat || 0))
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('GENERAL.LABELS.STATUS').toUpperCase() + ' (' +
								  this.translateService.instant('FINANCE.PROJECT.LABELS.LIABILITIES_ACCOUNTANT_ONLY').toUpperCase() + '):\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: bill_status
						}
					]
				},
				{
					richText: []
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.TOTAL') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: TableUtil.getNumberFormatForExcel(this.bill.total_real || 0)
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
							text: TableUtil.getNumberFormatForExcel(this.bill.total_vat_real || 0)
						}
					]
				},
				{
					richText: [
						{
							font: {name: 'Tahoma', family: 4, size: 12, bold: true},
							text: this.translateService.instant('FINANCE.PROJECT.LABELS.RECEIVED_DATE') + ':\n'
						},
						{
							font: {name: 'Tahoma', family: 4, size: 12},
							text: this.bill.received_date ? TableUtil.getDateFormatForExcel(new Date(this.bill.received_date)) : ''
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
							text: TableUtil.getNumberFormatForExcel((this.bill.total_real || 0) + (this.bill.total_vat_real || 0))
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
				this.translateService.instant('GENERAL.ATTRIBUTES.NUMBER_ORDER'),
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
		const title = 'Receivables Procedure';
		const sheetName = (this.data.po_name || 'data').toString().toUpperCase();
		const fileName = `Receivables_Procedure_${TableUtil.slug(this.data.po_name || '')}`;
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any, i: number) => {
			const dataItem: any[] = [];
			dataItem.push(TableUtil.pad(i + 1, 2));
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

	public exportExcel() {
		if (this.selectedTabIndex === 0) {
			this.exportBillInfo();
		} else if (this.selectedTabIndex === 1) {
			this.exportProcedure();
		}

		this.dialogRef.close('');
	}

}
