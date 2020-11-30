import {
	OnInit, OnDestroy,
	Component, Injector, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { VendorCategoryService } from '@finance/vendor/services/vendor-category.service';
import { DialogVendorCategoryComponent } from './dialog-vendor-category.component';
import { DialogConfirmComponent } from '@core';
import {MatSort} from "@angular/material/sort";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'vendor-category',
	templateUrl	: '../templates/vendor-category.pug',
	styleUrls	: [ '../styles/vendor-category.scss' ],
})
export class VendorCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	public isDeleting: boolean;
	public loaded: boolean;
	public displayedColumns: Array<string> = [ 'name', 'description', 'actions' ];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {VendorCategoryService} vendorCategoryService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector				: Injector,
		public dialog				: MatDialog,
		public vendorCategoryService: VendorCategoryService,
		public excelService: ExcelService,
		public snackBarService		: SnackBarService,
		public translateService		: TranslateService
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
	* Get vendor category list
	* @return {void}
	*/
	public getList() {
		this.loaded = false;
		this.setProcessing( true );

		this.vendorCategoryService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.dataSourceClone = result;
			this.dataSource.sort = this.sort;
			this.dataSource.data = result;
			this.applyFilter();
		} );
	}

	/**
	* Open dialog vendor category
	* @param {any} vendorCategory - Vendor category to bind to dialog
	* @return {void}
	*/
	public openDialog( vendorCategory?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogVendorCategoryComponent,
			{
				width	: '450px',
				data	: vendorCategory || null,
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
	* Delete vendor category
	* @param {any} vendorCategory - Vendor category to delete
	* @return {void}
	*/
	public delete( vendorCategory: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.VENDOR_CATEGORY.TITLES.DELETE_VENDOR_CATEGORY' ),
					content	: this.translateService.instant( 'FINANCE.VENDOR_CATEGORY.MESSAGES.DELETE_VENDOR_CATEGORY_CONFIRMATION', vendorCategory ),
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

			this.vendorCategoryService
			.delete( vendorCategory.id )
			.subscribe( ( result: any ) => {
				this.isDeleting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.VENDOR_CATEGORY.MESSAGES.DELETE_VENDOR_CATEGORY_FAIL', vendorCategory );
					return;
				}

				this.snackBarService.success( 'FINANCE.VENDOR_CATEGORY.MESSAGES.DELETE_VENDOR_CATEGORY_SUCCESS', vendorCategory );

				this.getList();
			} );
		} );
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Vendor Category', 'Description'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'vendor category'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Vendor Categories List';
		const sheetName = 'Vendor Categories';
		const fileName = 'Vendor_Categories_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			dataItem.push(item.name || 'N/A');
			dataItem.push(item.description || 'N/A');
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
