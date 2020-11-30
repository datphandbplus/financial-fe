import {
	OnInit, OnDestroy, ViewEncapsulation,
	Component, Injector, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { DialogCreateProjectComponent } from './dialog-create-project.component';
import { DialogProjectComponent } from './dialog-project.component';
import { Direction } from '@finance/finance-direction.component';
import { ProjectService } from '@finance/project/services/project.service';
import { DialogConfirmComponent } from '@core';
import {MatSort} from "@angular/material/sort";
import {ExcelService} from "@ext/lezo/services/excel.service";
import {TableUtil} from "@app/utils/tableUtils";

@Component({
	selector	: 'project',
	templateUrl	: '../templates/project.pug',
	styleUrls	: [ '../styles/project.scss' ],
	encapsulation	: ViewEncapsulation.None,
})
@Direction({
	path	: 'project',
	data	: { title: 'FINANCE.DIRECTION.QUOTATION_MANAGEMENT', icon: 'icon icon-quotation' },
	priority: 90,
	roles: [
		'CEO', 'CFO', 'GENERAL_ACCOUNTANT',
		'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
		'PM', 'SALE', 'QS',
		'PURCHASING', 'CONSTRUCTION',
	],
})
export class ProjectComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;
	public canAdd: boolean;
	public isDeleting: boolean;
	public isHideQuotation: boolean;
	public displayedColumns: Array<string> = [
		'project_code', 'project', 'client',
		'aic', 'total_value_vat', 'received_vat',
		'quotation_status', 'project_status', 'actions',
	];
	public footerRow: any = {};
	public queryOptions: any = {
		begin	: moment().clone().subtract( 1, 'year' ).startOf( 'year' ),
		end		: moment().clone().endOf( 'day' ),
	};

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {ProjectService} projectService
	*/
	constructor(
		public injector			: Injector,
		public dialog			: MatDialog,
		public excelService     : ExcelService,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService,
		public projectService	: ProjectService
	) {
		super( injector );

		this.canAdd = this.isCEO || this.isSale;

		// Hide Quotation and Received
		this.isHideQuotation = this.isGeneralAccountant || this.isLiabilitiesAccountant || this.isPurchasing
			|| this.isProcurementManager || this.isConstructionManager || this.isConstruction;
		this.isHideQuotation && ( this.displayedColumns.splice( 4, 2 ) );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
			const value: any = data[sortHeaderId];
			return typeof value === "string" ? value.toLowerCase() : value;
		};
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
	* Get projects
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;
		this.footerRow = {};

		let footerTotalLine: number = 0;
		let footerTotalBill: number = 0;

		this.projectService
		.getAll( 'all', this.queryOptions.begin, this.queryOptions.end )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );

			result = _.map( result, ( item: any ) => {
				item.project_status_name = _.findWhere( this.projectStatus, { id: item.project_status || 0 } );
				item.quotation_status_name = _.findWhere( this.quotationStatus, { id: item.quotation_status || 0 } );
				item.project_manager_name = item.user.full_name || '';

				item = this.customTotalItemProject(item);

				footerTotalLine += item.total_line;
				footerTotalBill += item.total_bill;
				return item;
			} );

			this.loaded = true;
			this.dataSource.sort = this.sort;
			this.dataSourceClone = result;
			this.dataSource.data = result;
			this.footerRow.total = footerTotalLine;
			this.footerRow.total_bill = footerTotalBill;
			this.applyFilter();
		} );
	}

	/**
	* Convert project
	* @param {any} project - Item project
	* @return {any}
	*/
	private customTotalItemProject(item: any) {
		let totalBill: number = 0;
		_.each( item.project_bills, ( bill: any ) => {
			totalBill += bill.total_real + bill.total_vat_real;
		} );
		item.total_bill = totalBill;

		let totalLine: number = 0;
		_.each( _.map( item.project_sheets, 'project_line_items' ), ( line: any ) => {
			totalLine += _.reduce(
				_.map( line, 'total' ), ( memo: number, num: number ) => memo + num, 0
			) || 0;
		} );

		const discountValue: number = item.discount_type === '$'
			? item.discount_amount
			: totalLine * item.discount_amount / 100;

		item.total_line = ( totalLine - discountValue ) * 1.1;

		return item;
	}

	/**
	* Open dialog project to create/update
	* @param {any} project - Project data need create/update
	* @return {void}
	*/
	public openDialog( project?: any ) {
		const dialogComponent: any = project
			? DialogProjectComponent
			: DialogCreateProjectComponent;

		const dialogRef: any = this.dialog.open(
			dialogComponent,
			{
				width	: '800px',
				data	: project || null,
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( result: any ) => {
			if ( !result ) return;

			this.getList();
		} );
	}

	/**
	* Delete project
	* @param {any} project - Project data need delete
	* @return {void}
	*/
	public delete( project: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.PROJECT.TITLES.DELETE_PROJECT' ),
					content	: this.translateService.instant( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_CONFIRMATION', project ),
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

			this.isDeleting = true;
			this.setProcessing( true );

			this.projectService
			.delete( project.id )
			.subscribe( ( result: any ) => {
				this.isDeleting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_FAIL', project );
					return;
				}

				this.snackBarService.success( 'FINANCE.PROJECT.MESSAGES.DELETE_PROJECT_SUCCESS', project );

				this.getList();
			} );
		} );
	}

	/**
	* Format filter
	* @return {string}
	*/
	public get format(): string {
		if ( !this.queryOptions ) return;

		return moment( this.queryOptions.begin ).format( 'DD/MM/YYYY' )
			+ ' - '
			+ moment( this.queryOptions.end ).format( 'DD/MM/YYYY' );
	}

	/**
	* Quotation range change
	* @param {any} event
	* @return {void}
	*/
	public quotationRangeChange( event: any ) {
		if ( !event || !event.value ) return;

		this.getList();
	}

	/**
	* Custom filter
	* @return {void}
	*/
	public customFilter() {
		this.applyFilter();
		this.customTotal();
	}

	/**
	* Custom Total
	* @return {void}
	*/
	public customTotal() {
		let footerTotalLine: number = 0;
		let footerTotalBill: number = 0;

		_.each( this.dataSource.filteredData, ( item: any ) => {
			item = this.customTotalItemProject(item);

			footerTotalLine += item.total_line;
			footerTotalBill += item.total_bill;
		} );

		this.footerRow.total = footerTotalLine;
		this.footerRow.total_bill = footerTotalBill;
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Project Code', 'Project', 'Client', 'Project Manager', 'Total Value (with VAT)', 'Received (with VAT)', 'Quotation Status', 'Project Status'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'quotation'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Quotation Management List';
		const sheetName = 'Quotations';
		const fileName = 'Quotation_Management_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			const quotation_status = (item.quotation_status_name && item.quotation_status_name.name) ? {value: this.translateService.instant(item.quotation_status_name.name), fgColor: item.quotation_status_name.color ? item.quotation_status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
			const project_status = (item.project_status_name && item.project_status_name.name) ? {value: this.translateService.instant(item.project_status_name.name), fgColor: item.project_status_name.color ? item.project_status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
			dataItem.push(item.project_code || 'N/A');
			dataItem.push(item.name || 'N/A');
			dataItem.push(item.client_name || 'N/A');
			dataItem.push(item.project_manager_name || 'N/A');
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total_line) || '');
			dataItem.push(TableUtil.getNumberFormatForExcel(item.total_bill) || '');
			dataItem.push(quotation_status);
			dataItem.push(project_status);
			exportData.push(dataItem);
		});
		const extraData = [
			{title: 'Total', value: TableUtil.getNumberFormatForExcel(this.footerRow.total), fgColors: ['38AE00', '38AE00']},
			{title: 'Total Bills', value: TableUtil.getNumberFormatForExcel(this.footerRow.total_bill), fgColors: ['38AE00', '38AE00']}
		];
		this.excelService.exportArrayToExcel(
			exportData,
			title,
			headerSetting,
			sheetName,
			fileName,
			extraData
		);
	}

}
