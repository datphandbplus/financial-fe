import {
	OnInit, OnDestroy,
	Component, Injector
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { LineItemCategoryService } from '@finance/line-item/services/line-item-category.service';
import { DialogLineItemCategoryComponent } from './dialog-line-item-category.component';
import { DialogConfirmComponent } from '@core';

@Component({
	selector	: 'line-item-category',
	templateUrl	: '../templates/line-item-category.pug',
	styleUrls	: [ '../styles/line-item-category.scss' ],
})
export class LineItemCategoryComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public isDeleting: boolean;
	public loaded: boolean;
	public displayedColumns: Array<string> = [ 'name', 'description', 'actions' ];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {LineItemCategoryService} lineItemCategoryService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector					: Injector,
		public dialog					: MatDialog,
		public lineItemCategoryService	: LineItemCategoryService,
		public snackBarService			: SnackBarService,
		public translateService			: TranslateService
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
	* Get line item category list
	* @return {void}
	*/
	public getList() {
		this.loaded = false;
		this.setProcessing( true );

		this.lineItemCategoryService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			this.dataSourceClone = result;
			this.dataSource.data = result;
			this.applyFilter();
		} );
	}

	/**
	* Open dialog line item category
	* @param {any} lineItemCategory - Line item category to bind to dialog
	* @return {void}
	*/
	public openDialog( lineItemCategory?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogLineItemCategoryComponent,
			{
				width	: '450px',
				data	: lineItemCategory || null,
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
	* Delete line item category
	* @param {any} lineItemCategory - Line item category to delete
	* @return {void}
	*/
	public delete( lineItemCategory: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: this.translateService.instant( 'FINANCE.LINE_ITEM_CATEGORY.TITLES.DELETE_LINE_ITEM_CATEGORY' ),
					content: this.translateService.instant(
						'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.DELETE_LINE_ITEM_CATEGORY_CONFIRMATION',
						lineItemCategory
					),
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

			this.lineItemCategoryService
			.delete( lineItemCategory.id )
			.subscribe( ( result: any ) => {
				this.isDeleting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.DELETE_LINE_ITEM_CATEGORY_FAIL', lineItemCategory );
					return;
				}

				this.snackBarService.success( 'FINANCE.LINE_ITEM_CATEGORY.MESSAGES.DELETE_LINE_ITEM_CATEGORY_SUCCESS', lineItemCategory );

				this.getList();
			} );
		} );
	}

}
