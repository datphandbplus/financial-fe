import {
	OnInit, OnDestroy,
	Component, Injector, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { SnackBarService } from 'angular-core';
import { TranslateService } from '@ngx-translate/core';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ClientService } from '@finance/client/services/client.service';
import { DialogClientComponent } from './dialog-client.component';
import { DialogConfirmComponent } from '@core';
import { Direction } from '@finance/finance-direction.component';
import {MatSort} from "@angular/material/sort";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'client',
	templateUrl	: '../templates/client.pug',
	styleUrls	: [ '../styles/client.scss' ],
})
@Direction({
	path	: 'client',
	data	: { title: 'FINANCE.DIRECTION.CLIENT', icon: 'icon icon-client' },
	priority: 40,
	roles	: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
})
export class ClientComponent extends FinanceBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	public loaded: boolean;
	public isSubmitting: boolean;
	public displayedColumns: Array<string> = [
		'name', 'tax', 'phone',
		'status', 'actions',
	];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {ClientService} clientService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	*/
	constructor(
		public injector			: Injector,
		public dialog			: MatDialog,
		public clientService	: ClientService,
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
	* Get client list
	* @return {void}
	*/
	public getList() {
		this.setProcessing( true );
		this.loaded = false;

		this.clientService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			result.forEach((item: any) => {
				item.status = item.is_disabled ? 0 : 1;
				if (!this.loaded || this.isSubmitting) {
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
	* Open dialog client
	* @param {any} client - Client to bind to dialog
	* @return {void}
	*/
	public openDialog( client?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogClientComponent,
			{
				width	: '550px',
				data	: client || null,
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
	* Delete client
	* @param {any} client - Client to delete
	* @return {void}
	*/
	public delete( client: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.CLIENT.TITLES.DELETE_CLIENT' ),
					content	: this.translateService.instant( 'FINANCE.CLIENT.MESSAGES.DELETE_CLIENT_CONFIRMATION', client ),
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
			this.setProcessing( true );

			this.clientService
			.delete( client.id )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.CLIENT.MESSAGES.DELETE_CLIENT_FAIL', client );
					return;
				}

				this.snackBarService.success( 'FINANCE.CLIENT.MESSAGES.DELETE_CLIENT_SUCCESS', client );

				this.getList();
			} );
		} );
	}

	/**
	* Toggle client status
	* @param {any} client - Client to toggle status
	* @return {void}
	*/
	public toggleStatus( client: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: client.is_disabled
						? this.translateService.instant( 'FINANCE.CLIENT.TITLES.DISABLE_CLIENT' )
						: this.translateService.instant( 'FINANCE.CLIENT.TITLES.ACTIVATE_CLIENT' ),
					content: client.is_disabled
						? this.translateService.instant( 'FINANCE.CLIENT.MESSAGES.DISABLE_CLIENT_CONFIRMATION', client )
						: this.translateService.instant( 'FINANCE.CLIENT.MESSAGES.ACTIVATE_CLIENT_CONFIRMATION', client ),
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
				client.is_disabled = !client.is_disabled;
				return;
			}

			this.isSubmitting = true;
			this.setProcessing( true );

			this.clientService
			.update( client.id, client )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.CLIENT.MESSAGES.UPDATE_CLIENT_FAIL', client );
					return;
				}

				this.snackBarService.success( 'FINANCE.CLIENT.MESSAGES.UPDATE_CLIENT_SUCCESS', client );
			} );
		} );
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Client', 'Tax Number', 'Phone', 'Status'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'client'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Clients List';
		const sheetName = 'Clients';
		const fileName = 'Clients_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			const status = item.status ? {value: 'Active', fgColor: '00FF00'} : {value: 'Disabled', fgColor: 'FF0000'};
			dataItem.push(item.name || 'N/A');
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
