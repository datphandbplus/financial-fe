import {
	OnInit, OnDestroy, Component,
	Injector, Input, ViewChild,
	Output, EventEmitter
} from '@angular/core';
import { MatDialog, MatPaginator, MatTableDataSource } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'underscore';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogProjectBillComponent } from './dialog-project-bill.component';
import { DialogProjectBillPlanComponent } from './dialog-project-bill-plan.component';
import { DialogProjectBillInvoiceComponent } from './dialog-project-bill-invoice.component';
import { DialogPlanApproverComponent } from './dialog-plan-approver.component';
import { ProjectService } from '@finance/project/services/project.service';
import { ProjectBillService } from '@finance/project/services/project-bill.service';
import { ProjectBillPlanService } from '@finance/project/services/project-bill-plan.service';
import { DialogConfirmComponent } from '@core';
import {
	BILL_STATUS, PLAN_STATUS,
	PROCEDURE_STATUS, QUOTATION_STATUS
} from '@resources';
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'project-receivables',
	templateUrl	: '../templates/project-receivables.pug',
	styleUrls	: [ '../styles/project-receivables.scss' ],
})
export class ProjectReceivablesComponent extends ProjectBaseComponent implements OnInit, OnDestroy {

	@Input() public project: any;
	@Input() public projectId: number;
	@Input() public loaded: boolean;
	@Input() public activeBillId: number;
	@Input() public canManageBill: boolean;
	@ViewChild('billSort') billSort: MatSort;
	@ViewChild('billPlanSort') billPlanSort: MatSort;

	@Output() public refreshProjectDetail: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild( 'paginatorBillPlan' ) set paginatorBillPlan( paginator: MatPaginator ) {
		this.billPlanDataSource.paginator = paginator;
	}

	public billPlanDataSource: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
	public displayedColumns: Array<string> = [
		'item', 'total', 'vat',
		'sum', 'expected_invoice_date', 'receivable_date',
		'procedure', 'status', 'invoice',
		'created_at', 'actions',
	];
	public billPlanDisplayedColumns: Array<string> = [
		'name', 'target_date', 'target_percent',
		'note', 'actions',
	];
	public selectedTabIndex: number = 0;
	public footerRow: any = { total: 0, vat: 0, total_real: 0 };
	public BILL_STATUS: any = BILL_STATUS;
	public PLAN_STATUS: any = PLAN_STATUS;
	public QUOTATION_STATUS: any = QUOTATION_STATUS;
	public PROCEDURE_STATUS: any = PROCEDURE_STATUS;

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {Router} router
	* @param {ActivatedRoute} route
	* @param {ProjectService} projectService
	* @param {ProjectBillService} projectBillService
	* @param {ProjectBillPlanService} projectBillPlanService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService,
		public excelService				: ExcelService,
		public router					: Router,
		public route					: ActivatedRoute,
		public projectService			: ProjectService,
		public projectBillService		: ProjectBillService,
		public projectBillPlanService	: ProjectBillPlanService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		if ( isNaN( this.projectId ) ) {
			this.backToList();
			return;
		}

		this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

		this.billPlanDataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};

		if ( this.activeBillId ) this.activeBillId = this.activeBillId * 1;

		this.initData();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
	}

	/**
	* Init all data
	* @return {void}
	*/
	public initData() {
		this.getList();
	}

	/**
	* Tab changed
	* @param {number} tabIndex
	* @return {void}
	*/
	public tabChanged( tabIndex: number ) {
		switch ( tabIndex ) {
			case 0:
				( !this.dataSource.data || !this.dataSource.data.length )
					&& this.getList();
				return;
			case 1:
				( !this.billPlanDataSource.data || !this.billPlanDataSource.data.length )
					&& this.getListPlan();
				return;
		}
	}

	/**
	* Get project bills plans
	* @return {void}
	*/
	public getListPlan() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectBillPlanService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.billPlanDataSource.sort = this.billPlanSort;
			this.billPlanDataSource.data = result;
		} );

		this.getProjectDetail();
	}

	/**
	* Delete project Bill plan
	* @param {any} projectBillPlan - Project Bill plan data need delete
	* @return {void}
	*/
	public deleteProjectBillPlan( projectBillPlan: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_BILL_PLAN' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_BILL_PLAN_CONFIRMATION', projectBillPlan ),
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

			this.projectBillPlanService
			.delete( projectBillPlan.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_PLAN_FAIL', projectBillPlan );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_PLAN_SUCCESS', projectBillPlan );

				this.getListPlan();
			} );
		} );
	}

	/**
	* Open dialog project Bill plan to create/update
	* @param {any} projectBillPlan - Project Bill plan data need create/update
	* @return {void}
	*/
	public openDialogProjectBillPlan( projectBillPlan?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectBillPlanComponent,
			{
				width: '650px',
				data: {
					...projectBillPlan,
					project_id: this.projectId,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getListPlan();
		} );
	}

	/**
	* Confirm update plan project
	* @param {string} planStatus
	* @return {void}
	*/
	public confirmUpdatePlanProject( planStatus: string ) {
		const updateData: any = {};
		let confirmation: string;

		if ( planStatus === 'waiting_approval' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.SUBMIT_PLAN_CONFIRMATION',
				this.project
			);
			updateData.bill_plan_status = PLAN_STATUS.WAITING_APPROVAL;
		}

		if ( planStatus === 'approve' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.APPROVE_PLAN_CONFIRMATION',
				this.project
			);
			updateData.bill_plan_status = PLAN_STATUS.APPROVED;
		}

		if ( planStatus === 'cancel' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.CANCEL_PLAN_CONFIRMATION',
				this.project
			);
			updateData.bill_plan_status = PLAN_STATUS.CANCELLED;
		}

		if ( planStatus === 'reject' ) {
			confirmation = this.translateService.instant(
				'FINANCE.PROJECT.MESSAGES.REJECT_PLAN_CONFIRMATION',
				this.project
			);
			updateData.bill_plan_status = PLAN_STATUS.REJECTED;
		}

		this.updatePlanStatus( updateData, confirmation );
	}

	/**
	* Update project plan status
	* @param {any} data
	* @param {string} confirmation
	* @return {void}
	*/
	public updatePlanStatus( data: any, confirmation: string ) {
		const dialogData: any = {
			project	: this.project,
			status	: data.bill_plan_status,
			type	: 'bill',
			confirmation,
		};

		dialogData.comment = this.project.bill_plan_comment;

		const dialogRef: any = this.dialog.open(
			DialogPlanApproverComponent,
			{
				width	: '400px',
				data	: dialogData,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) return;

			this.getListPlan();
		} );
	}

	/**
	* Get projects
	* @return {void}
	*/
	public getProjectDetail() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectService
		.getOne( this.projectId, 'project_info' )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.project.bill_plan_comment = result.bill_plan_comment;
			this.project.bill_plan_status = result.bill_plan_status;
			this.project.bill_plan_approver = result.bill_plan_approver;
			this.project.bill_plan_status_name = this.planStatus[ result.bill_plan_status ];
			this.loaded = true;
		} );
	}

	/**
	* Get project bills
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;

		this.projectBillService
		.getAll( this.projectId )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.footerRow.total = 0;
			this.footerRow.total_vat = 0;
			this.footerRow.total_real = 0;
			this.footerRow.total_vat_real = 0;

			_.each( result, ( item: any ) => {
				this.getReceivableDateAndCountDay( item );

				if ( item.invoices && item.invoices.length ) item.invoice = item.invoices.slice( -1 ).pop();

				item.total_procedures = item.procedures.length;
				item.confirmed_procedures = _.filter(
					item.procedures,
					( procedure: any ) => procedure.status === PROCEDURE_STATUS.CONFIRMED
				).length;

				// Check has total and total VAT real
				item.hasReal = item.status === BILL_STATUS.MONEY_COLLECTED;

				item.received = item.hasReal ? item.total_real : item.total || 0;
				item.received_vat = item.hasReal ? item.total_vat_real : item.total_vat || 0;
				item.sum = item.received + item.received_vat;

				this.footerRow.total += item.received;
				this.footerRow.total_vat += item.received_vat;
				item.hasReal && ( this.footerRow.total_real += item.total_real );
				item.hasReal && ( this.footerRow.total_vat_real += item.total_vat_real );

				this.arrangeStatusByRole( item );
			});

			this.dataSource.sort = this.billSort;
			this.dataSource.data = this.customSortDataSource( result );

			if ( this.activeBillId ) {
				const projectBill: any = _.findWhere( result, { id: this.activeBillId } );

				if ( !projectBill || ( !this.isCFO && !this.isLiabilitiesAccountant && !this.isProcurementManager ) ) return;

				if ( ( this.isLiabilitiesAccountant && projectBill.status === BILL_STATUS.WAITING )
					|| ( this.isCFO && projectBill.status !== BILL_STATUS.MONEY_COLLECTED ) ) {
					this.openDialog( projectBill );
				}

				if ( this.isProcurementManager && projectBill.status === BILL_STATUS.MONEY_COLLECTED ) {
					this.openDialog( projectBill );
				}
			}
		} );
	}

	/**
	* Arrange status by role
	* @param {any} payment
	* @return {array}
	*/
	public arrangeStatusByRole( payment: any ) {
		switch ( payment.status_name.key ) {
			case 'WAITING':
				if ( this.isLiabilitiesAccountant ) {
					payment.status_name.priority = 3;
				}
				break;
			case 'PROCESSING':
				if ( this.isLiabilitiesAccountant ) {
					payment.status_name.priority = 4;
				}
				break;
		}
	}

	/**
	* Open dialog project bill to create/update
	* @param {any} projectBill - Project bill data need create/update
	* @return {void}
	*/
	public openDialog( projectBill?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogProjectBillComponent,
			{
				width		: '650px',
				panelClass	: [ 'dialog-project-bill', 'mat-dialog' ],
				data: {
					...projectBill,
					project_id			: this.project.id,
					project_name		: this.project.name,
					total_planed		: this.footerRow.total,
					total_vat_planed	: this.footerRow.total_vat,
					all_total_real		: this.footerRow.total_real,
					all_total_vat_real	: this.footerRow.total_vat_real,
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.activeBillId = null;
			this.getList();

			this.refreshProjectDetail.emit();
		} );
	}

	/**
	* Open dialog project bill invoice history
	* @param {any} projectBill - Project bill data need create/update
	* @return {void}
	*/
	public openDialogInvoiceHistory( projectBill: any ) {
		this.dialog.open(
			DialogProjectBillInvoiceComponent,
			{
				width: '650px',
				data: {
					...projectBill,
					project_id	: this.project.id,
					project_name: this.project.name,
				},
			}
		);
	}

	/**
	* Delete project bill
	* @param {any} projectBill - Project bill data need delete
	* @return {void}
	*/
	public delete( projectBill: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_BILL' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_BILL_CONFIRMATION', projectBill ),
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

			this.projectBillService
			.delete( projectBill.id )
			.subscribe( ( result: any ) => {
				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_FAIL', projectBill );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_BILL_SUCCESS', projectBill );

				this.activeBillId = null;
				this.getList();
			} );
		} );
	}

	/**
	* Back to projects list
	* @return {void}
	*/
	public backToList() {
		this.router.navigate( [ 'finance/project' ] );
	}

	/**
	 * Download template
	 * @return {void}
	 */
	public exportExcel() {
		const _this = this;
		this.projectService
			.getOne( this.projectId, 'project_info' )
			.subscribe( ( resultPlanStatus: any ) => {
				const bill_plan_status = resultPlanStatus.bill_plan_status;
				const bill_plan_approver = resultPlanStatus.bill_plan_approver;
				const bill_plan_status_name = _this.planStatus[ resultPlanStatus.bill_plan_status ];
				const titles = ['Receivables List', 'Receivables Plan List'];
				const sheetNames = ['Receivables', 'Receivables Plan'];
				const fileName = `${TableUtil.slug(_this.project.name || '')}_Receivables`;
				let bgColor = '';
				if (bill_plan_status === _this.PLAN_STATUS.PROCESSING) {
					bgColor = '2196F3';
				} else if (
					bill_plan_status === _this.PLAN_STATUS.WAITING_APPROVAL ||
					bill_plan_status === _this.PLAN_STATUS.REJECTED ||
					bill_plan_status === _this.PLAN_STATUS.CANCELLED
				) {
					bgColor = 'FD8631';
				} else {
					bgColor = '38AE00';
				}
				const infoData = {
					data: [
						{
							title: _this.translateService.instant('FINANCE.PROJECT.LABELS.APPROVER'),
							value: (bill_plan_approver && bill_plan_approver.full_name)
								? bill_plan_approver.full_name
								: 'N/A'
						},
						{
							title: _this.translateService.instant('FINANCE.PROJECT.LABELS.BILL_PLAN_STATUS'),
							value: (bill_plan_status_name && bill_plan_status_name.name)
								? _this.translateService.instant(bill_plan_status_name.name)
								: 'N/A',
							bgColor:  (bill_plan_status_name && bill_plan_status_name.color)
								? bgColor
								: ''
						}
					],
					cols: 2,
					applySheetIndex: 1
				};
				const exportDatas: any[] = [];
				const extraDatas: any[] = [];
				const headerSettings: any[] = [
					{
						header: [
							_this.translateService.instant('GENERAL.ATTRIBUTES.ITEM'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
							_this.translateService.instant('GENERAL.ATTRIBUTES.VAT'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.SUM'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.EXPECTED_INVOICE_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.RECEIVABLE_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.PROCEDURE'),
							_this.translateService.instant('GENERAL.ATTRIBUTES.STATUS'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.INVOICE'),
							_this.translateService.instant('GENERAL.ATTRIBUTES.CREATED_AT')
						],
						fgColor: 'ffffff',
						bgColor: '00245A',
						noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'receivable'})
					},
					{
						header: [
							_this.translateService.instant('GENERAL.ATTRIBUTES.NAME'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TARGET_DATE'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TARGET_PERCENT'),
							_this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.NOTE')
						],
						fgColor: 'ffffff',
						bgColor: '00245A',
						noData: _this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'receivable plan'})
					}
				];
				const exportDataReceivables: any[] = [];
				this.dataSource.data.forEach((item: any) => {
					const dataItemReceivables: any[] = [];
					dataItemReceivables.push(item.name || 'N/A');
					dataItemReceivables.push(TableUtil.getNumberFormatForExcel(item.received || 0));
					dataItemReceivables.push(TableUtil.getNumberFormatForExcel(item.received_vat || 0));
					dataItemReceivables.push(TableUtil.getNumberFormatForExcel((item.received || 0) + (item.received_vat || 0)));
					dataItemReceivables.push(item.expected_invoice_date ? TableUtil.getDateFormatForExcel(new Date(item.expected_invoice_date) ): '');

					const receivable_date: any = {
						richText: [
							{font: {size: 12},text: (item.receivable_date ? TableUtil.getDateFormatForExcel(new Date(item.receivable_date)) : '')}
						]
					};
					if (item.receivable_date) {
						receivable_date.richText.push({
							font: {size: 12},text: '\n('
						});
						receivable_date.richText.push({
							font: {size: 12, color: {argb: (item.count_day && item.count_day > 0) ? '38AE00' : 'FF3636'}},
							text: TableUtil.pad(item.count_day || 0, 2) + ' ' + this.translateService.instant('GENERAL.LABELS.DAYS').toLowerCase()
						});
						receivable_date.richText.push({
							font: {size: 12},text: ')'
						});
					}
					dataItemReceivables.push(receivable_date);
					dataItemReceivables.push( item.total_procedures ? ( item.confirmed_procedures + '/' + item.total_procedures ) : 0);
					const status = (item.status_name && item.status_name.name) ? {value: this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
					dataItemReceivables.push(status);
					dataItemReceivables.push(item.invoice ? 'Has invoice' : '--');
					dataItemReceivables.push(item.created_at ? TableUtil.getDateFormatForExcel(new Date(item.created_at)) : '');
					exportDataReceivables.push(dataItemReceivables);
				});
				const extraDataReceivables = [
					{
						title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.TOTAL'),
						value: TableUtil.getNumberFormatForExcel(this.footerRow.total || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: this.translateService.instant('GENERAL.ATTRIBUTES.VAT'),
						value: TableUtil.getNumberFormatForExcel(this.footerRow.total_vat || 0),
						fgColors: ['38AE00', 'FD8631']
					},
					{
						title: this.translateService.instant('FINANCE.PROJECT.ATTRIBUTES.SUM'),
						value: TableUtil.getNumberFormatForExcel((this.footerRow.total || 0) + (this.footerRow.total_vat || 0)),
						fgColors: ['38AE00', 'FD8631']
					}
				];
				_this.projectBillPlanService
					.getAll( _this.projectId )
					.subscribe( ( result: any ) => {
						const exportDataReceivablesPlan: any[] = [];
						result = result || [];
						result.forEach((item: any) => {
							const dataItemReceivablesPlan: any[] = [];
							dataItemReceivablesPlan.push(item.name || 'N/A');
							dataItemReceivablesPlan.push(item.target_date ? TableUtil.getDateFormatForExcel(new Date(item.target_date)) : '');
							dataItemReceivablesPlan.push(TableUtil.getNumberFormatForExcel(item.target_percent || 0) + '%');
							dataItemReceivablesPlan.push(item.note || 'N/A');
							exportDataReceivablesPlan.push(dataItemReceivablesPlan);
						});
						const extraDataReceivablesPlan = [];
						exportDatas.push(exportDataReceivables);
						extraDatas.push(extraDataReceivables);
						exportDatas.push(exportDataReceivablesPlan);
						extraDatas.push(extraDataReceivablesPlan);
						_this.excelService.exportArraysToExcel(
							exportDatas,
							titles,
							headerSettings,
							sheetNames,
							fileName,
							extraDatas,
							infoData
						);
					} );
			} );
	}

}
