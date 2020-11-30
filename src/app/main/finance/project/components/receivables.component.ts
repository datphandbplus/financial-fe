import {
	Component, OnInit,
	Injector, OnDestroy, ViewChild
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';
import moment from 'moment-timezone';

import { ProjectBaseComponent } from '@finance/project/project-base.component';
import { Direction } from '@finance/finance-direction.component';
import { ReceivableService } from '@finance/project/services/receivable.service';

import { BILL_STATUS } from '@resources';
import {MatSort} from "@angular/material/sort";
import {SnackBarService} from "angular-core";
import {ExcelService} from "../../../ext/lezo/services/excel.service";
import {TableUtil} from "@app/utils/tableUtils";

@Component({
	selector	: 'receivables',
	templateUrl	: '../templates/receivables.pug',
	styleUrls	: [ '../styles/receivables.scss' ],
})
@Direction({
	path	: 'receivables',
	data	: { title: 'FINANCE.DIRECTION.RECEIVABLES', icon: 'icon icon-revenue' },
	priority: 80,
	roles: [
		'CEO', 'CFO', 'PM',
		'GENERAL_ACCOUNTANT', 'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER',
	],
})
export class ReceivablesComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	public sortKey: string = 'project.name';
	public displayedColumns: Array<string> = [
		'project', 'client', 'aic',
		'amount', 'expected_invoice_date',
		'receivable_date', 'status',
	];
	public receivables: Array<any> = [];
	public currentDate: any = moment();
	public filters: any = {
		expected_invoice_date: {
			begin	: this.currentDate.clone().startOf( 'Y' ),
			end		: this.currentDate.clone().endOf( 'Y' ),
		},
		receivable_date: {
			begin	: this.currentDate.clone().startOf( 'Y' ),
			end		: this.currentDate.clone().endOf( 'Y' ),
		},
	};
	public footerRow: any = { total: 0 };

	/**
	* @constructor
	* @param {Injector} injector
	* @param {ReceivableService} receivableService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector			: Injector,
		public receivableService: ReceivableService,
		public excelService: ExcelService,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService
	) {
		super( injector );

		if ( this.isPM ) {
			this.displayedColumns.splice( 2, 1 ); // Remove AIC Column
		}
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
	* Get all revenue
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;

		this.receivableService
		.getAll( this.filters.expected_invoice_date.begin, this.filters.expected_invoice_date.end )
		.subscribe( ( result: any ) => {
			this.setProcessing( false );

			const projectIds: Array<number> = [];
			const clientIds: Array<number> = [];
			const aicIds: Array<number> = [];
			const statusIds: Array<number> = [];

			result = _.map( result, ( item: any ) => {
				this.getReceivableDateAndCountDay( item );
				item.last_total = item.status === BILL_STATUS.MONEY_COLLECTED
					? item.total_real + item.total_vat_real
					: item.total + item.total_vat;

				// Set filters
				if ( item.project ) {
					item.project.id && projectIds.push( item.project.id );
					item.project.client && item.project.client.id && clientIds.push( item.project.client.id );
					item.project.user && item.project.user.id && aicIds.push( item.project.user.id );
				}

				item.status_name && item.status_name.id >= 0 && statusIds.push( item.status_name.id );
				item.client_name = item.project.client_name || '';
				item.manager_name = item.project.user.full_name || '';

				return item;
			} );

			this.loaded = true;

			this.filters[ 'project.id' ] = _.uniq( projectIds );
			this.filters[ 'project.client.id' ] = _.uniq( clientIds );
			this.filters[ 'project.user.id' ] = _.uniq( aicIds );
			this.filters[ 'status_name.id' ] = _.uniq( statusIds );
			this.receivables = result;
			this.dataSource.sort = this.sort;
			this.dataSource.data = this.customSortDataSource( result );
			this.dataSourceClone = result;
			this.customFilter();
		} );
	}

	/**
	* Handle project change event
	* @return {void}
	*/
	public onProjectChange() {
		const clientIds: Array<number> = [];
		const aicIds: Array<number> = [];
		const statusIds: Array<number> = [];

		_.map( this.receivables, ( item: any ) => {
			if ( !item.project || !_.contains( this.filters[ 'project.id' ], item.project_id ) ) return;

			item.project.client && item.project.client.id && clientIds.push( item.project.client.id );
			item.project.user && item.project.user.id && aicIds.push( item.project.user.id );

			item.status_name && item.status_name.id >= 0 && statusIds.push( item.status_name.id );
		} );

		this.filters[ 'project.client.id' ] = _.uniq( clientIds );
		this.filters[ 'project.user.id' ] = _.uniq( aicIds );
		this.filters[ 'status_name.id' ] = _.uniq( statusIds );
	}

	/**
	* Reset filter
	* @return {void}
	*/
	public resetFilter() {
		this.filters = {
			expected_invoice_date: {
				begin	: this.currentDate.clone().startOf( 'Y' ),
				end		: this.currentDate.clone().endOf( 'Y' ),
			},
			receivable_date: {
				begin	: this.currentDate.clone().startOf( 'Y' ),
				end		: this.currentDate.clone().endOf( 'Y' ),
			},
		};
	}

	/**
	* Custom filter
	* @return {void}
	*/
	public customFilter() {
		this.applyFilter();

		let amount: number = 0;

		_.each( this.dataSource.filteredData, ( item: any ) => {
			amount += item.status === BILL_STATUS.MONEY_COLLECTED
				? item.total_real + item.total_vat_real
				: item.total + item.total_vat;
		} );

		this.footerRow.total = amount;
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Project', 'Client', 'Project Manager', 'Amount', 'Expected Invoice Date', 'Receivable Date', 'Status'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'receivable'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Receivables List';
		const sheetName = 'Receivables';
		const fileName = 'Receivables_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			const expected_invoice_date = item.expected_invoice_date ? TableUtil.getDateFormatForExcel(new Date(item.expected_invoice_date)) : '';
			const receivable_date = item.receivable_date ? TableUtil.getDateFormatForExcel(new Date(item.receivable_date)) : '';
			const status = (item.status_name && item.status_name.key) ? {value: item.status_name.key, fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
			dataItem.push(item.name || 'N/A');
			dataItem.push(item.client_name || 'N/A');
			dataItem.push(item.manager_name || 'N/A');
			dataItem.push(TableUtil.getNumberFormatForExcel(item.last_total) || '');
			dataItem.push(expected_invoice_date);
			dataItem.push(receivable_date);
			dataItem.push(status);
			exportData.push(dataItem);
		});
		const extraData = [{title: 'Total', value: TableUtil.getNumberFormatForExcel(this.footerRow.total), fgColors: ['38AE00', 'FD8631']}];
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
