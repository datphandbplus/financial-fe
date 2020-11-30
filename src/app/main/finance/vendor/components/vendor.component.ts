import {
	OnInit, OnDestroy,
	Component, Injector, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { VendorService } from '@finance/vendor/services/vendor.service';
import { DialogVendorComponent } from './dialog-vendor.component';
import { DialogConfirmComponent } from '@core';
import {MatSort} from "@angular/material/sort";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'vendor',
	templateUrl	: '../templates/vendor.pug',
	styleUrls	: [ '../styles/vendor.scss' ],
})
export class VendorComponent extends FinanceBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	public loaded: boolean;
	public isSubmitting: boolean;
	public displayedColumns: Array<string> = [
		'name', 'category', 'tax',
		'phone', 'status', 'actions',
	];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {VendorService} vendorService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector			: Injector,
		public dialog			: MatDialog,
		public vendorService	: VendorService,
		public excelService: ExcelService,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
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
	* Get vendor list
	* @return {void}
	*/
	public getList() {
		this.loaded = false;
		this.setProcessing( true );

		this.vendorService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			result.forEach((item: any) => {
				item.category_name = (item.vendor_category && item.vendor_category.name) ? item.vendor_category.name : '';
				item.status = item.is_disabled ? 0 : 1;
				if (!this.loaded || this.isSubmitting || this.isConstructionManager) {
					item.status = 2;
				}
			});
			this.dataSourceClone = result;
			this.dataSource.sort = this.sort;
			this.dataSource.data = result;
			this.applyFilter();
		} );
	}

	/**
	* Open dialog vendor
	* @param {any} vendor - Vendor to bind to dialog
	* @return {void}
	*/
	public openDialog( vendor?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogVendorComponent,
			{
				width	: '550px',
				data	: vendor || null,
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
	* Delete vendor
	* @param {any} vendor - Vendor to delete
	* @return {void}
	*/
	public delete( vendor: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: this.translateService.instant( 'FINANCE.VENDOR.TITLES.DELETE_VENDOR' ),
					content: this.translateService.instant( 'FINANCE.COST_ITEM.MESSAGES.DELETE_ALL_COST_ITEM_VENDOR_NOTE' )
						+ '<br>' + this.translateService.instant( 'FINANCE.VENDOR.MESSAGES.DELETE_VENDOR_CONFIRMATION', vendor ),
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

			this.isSubmitting = true;

			this.vendorService
			.delete( vendor.id )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.VENDOR.MESSAGES.DELETE_VENDOR_FAIL', vendor );
					return;
				}

				this.snackBarService.success( 'FINANCE.VENDOR.MESSAGES.DELETE_VENDOR_SUCCESS', vendor );

				this.getList();
			} );
		} );
	}

	/**
	* Toggle vendor status
	* @param {any} vendor - Vendor to toggle status
	* @return {void}
	*/
	public toggleStatus( vendor: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: vendor.is_disabled
						? this.translateService.instant( 'FINANCE.VENDOR.TITLES.DISABLE_VENDOR' )
						: this.translateService.instant( 'FINANCE.VENDOR.TITLES.ACTIVATE_VENDOR' ),
					content: vendor.is_disabled
						? this.translateService.instant( 'FINANCE.VENDOR.MESSAGES.DISABLE_VENDOR_CONFIRMATION', vendor )
						: this.translateService.instant( 'FINANCE.VENDOR.MESSAGES.ACTIVATE_VENDOR_CONFIRMATION', vendor ),
					actions: {
						yes: { color: 'warn' },
					},
				},
			}
		);

		dialogRef
		.afterClosed()
		.subscribe( ( _result: any ) => {
			if ( !_result ) {
				vendor.is_disabled = !vendor.is_disabled;
				return;
			}

			this.isSubmitting = true;
			this.setProcessing( true );

			this.vendorService
			.update( vendor.id, vendor )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.VENDOR.MESSAGES.UPDATE_VENDOR_FAIL', vendor );
					return;
				}

				this.snackBarService.success( 'FINANCE.VENDOR.MESSAGES.UPDATE_VENDOR_SUCCESS', vendor );
			} );
		} );
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Vendor', 'Category', 'Tax Number', 'Phone', 'Status'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'vendor'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Vendors List';
		const sheetName = 'Vendors';
		const fileName = 'Vendors_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			const status = item.status ? {value: 'Active', fgColor: '00FF00'} : {value: 'Disabled', fgColor: 'FF0000'};
			dataItem.push(item.name || 'N/A');
			dataItem.push(item.category_name || 'N/A');
			dataItem.push(item.tax || '');
			dataItem.push(item.phone || '');
			dataItem.push(status);
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

}
