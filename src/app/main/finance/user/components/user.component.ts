import {
	OnInit, OnDestroy,
	Component, Injector, ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AccountService } from '@account/services/account.service';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { UserService } from '@finance/user/services/user.service';
import { DialogUserComponent } from './dialog-user.component';
import { DialogConfirmComponent, SnackBarService } from '@core';
import { Direction } from '@finance/finance-direction.component';
import {MatSort} from "@angular/material/sort";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
	selector	: 'user',
	templateUrl	: '../templates/user.pug',
	styleUrls	: [ '../styles/user.scss' ],
})
@Direction({
	path	: 'user',
	data	: { title: 'FINANCE.DIRECTION.USER', icon: 'icon icon-account' },
	priority: 20,
	roles	: [ 'CEO', 'ADMIN' ],
})
export class UserComponent extends FinanceBaseComponent implements OnInit, OnDestroy {
	@ViewChild(MatSort) sort: MatSort;

	public loaded: boolean;
	public isSubmitting: boolean;
	public sortKey: string = 'full_name';
	public displayedColumns: Array<string> = [
		'name', 'email',
		'status', 'actions',
	];

	/**
	* @constructor
	* @param {Injector} injector
	* @param {MatDialog} dialog
	* @param {UserService} userService
	* @param {SnackBarService} snackBarService
	* @param {TranslateService} translateService
	* @param {AccountService} accountService
	*/
	constructor(
		public injector			: Injector,
		public dialog			: MatDialog,
		public userService		: UserService,
		public excelService: ExcelService,
		public snackBarService	: SnackBarService,
		public translateService	: TranslateService,
		public accountService	: AccountService
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
	* Get user list
	* @return {void}
	*/
	public getList() {
		this.loaded = false;
		this.setProcessing( true );

		this.userService
		.getAll()
		.subscribe( ( result: any ) => {
			this.setProcessing( false );
			this.loaded = true;
			result.forEach((item: any) => {
				item.status = item.is_disabled ? 0 : 1;
				if (!this.loaded || this.isSubmitting || !this.canEdit(item)) {
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
	* Open dialog user
	* @param {any} user - User to bind to dialog
	* @return {void}
	*/
	public openDialog( user?: any ) {
		const dialogRef: any = this.dialog.open(
			DialogUserComponent,
			{
				width	: '550px',
				data	: user || null,
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
	* Delete user
	* @param {any} user - User to delete
	* @return {void}
	*/
	public delete( user: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.USER.TITLES.DELETE_USER' ),
					content	: this.translateService.instant( 'FINANCE.USER.MESSAGES.DELETE_USER_CONFIRMATION', user ),
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

			this.userService
			.delete( user.id )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.USER.MESSAGES.DELETE_USER_FAIL', user );
					return;
				}

				this.snackBarService.success( 'FINANCE.USER.MESSAGES.DELETE_USER_SUCCESS', user );
				this.getList();
			} );
		} );
	}

	/**
	* Toggle user status
	* @param {any} user - User to toggle status
	* @return {void}
	*/
	public toggleStatus( user: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title: user.is_disabled
						? this.translateService.instant( 'FINANCE.USER.TITLES.DISABLE_USER' )
						: this.translateService.instant( 'FINANCE.USER.TITLES.ACTIVATE_USER' ),
					content: user.is_disabled
						? this.translateService.instant( 'FINANCE.USER.MESSAGES.DISABLE_USER_CONFIRMATION', user )
						: this.translateService.instant( 'FINANCE.USER.MESSAGES.ACTIVATE_USER_CONFIRMATION', user ),
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
				user.is_disabled = !user.is_disabled;
				return;
			}

			this.isSubmitting = true;
			this.setProcessing( true );

			this.userService
			.toggleStatus( user.id, user )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					user.is_disabled = !user.is_disabled;
					this.snackBarService.warn( 'FINANCE.USER.MESSAGES.UPDATE_USER_FAIL', user );
					return;
				}

				this.snackBarService.success( 'FINANCE.USER.MESSAGES.UPDATE_USER_SUCCESS', user );
			} );
		} );
	}

	/**
	* Send activation email
	* @param {any} user - User to resend
	* @return {void}
	*/
	public sendActivationEmail( user: any ) {
		const dialogRef: any = this.dialog.open(
			DialogConfirmComponent,
			{
				width: '400px',
				data: {
					title	: this.translateService.instant( 'FINANCE.USER.TITLES.SEND_ACTIVATION_EMAIL' ),
					content	: this.translateService.instant( 'FINANCE.USER.MESSAGES.SEND_ACTIVATION_EMAIL_CONFIRMATION', user ),
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

			this.userService
			.sendActivationEmail( user.id )
			.subscribe( ( result: any ) => {
				this.isSubmitting = false;
				this.setProcessing( false );

				if ( !result || !result.status ) {
					this.snackBarService.warn( 'FINANCE.USER.MESSAGES.SEND_ACTIVATION_EMAIL_FAIL', user );
					return;
				}

				user.is_disabled = true;
				this.snackBarService.success( 'FINANCE.USER.MESSAGES.SEND_ACTIVATION_EMAIL_SUCCESS', user );
			} );
		} );
	}

	/**
	* Can edit user
	* @param {any} user - User to check can edit
	* @return {boolean}
	*/
	public canEdit( user: any ): boolean {
		if ( user.is_owner ) return false;
		return this.isSuperAdmin || user.role_key !== 'CEO';
	}

	public exportExcel() {
		const headerSetting = {
			header: ['Full Name', 'Email', 'Status'],
			noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'user'}),
			fgColor: 'ffffff',
			bgColor: '00245A'
		};
		const title = 'Users List';
		const sheetName = 'Users';
		const fileName = 'Users_List';
		const exportData: any[] = [];
		this.dataSource.data.forEach((item: any) => {
			const dataItem: any[] = [];
			const status = item.status ? {value: 'Active', fgColor: '00FF00'} : {value: 'Disabled', fgColor: 'FF0000'};
			dataItem.push(item.full_name || 'N/A');
			dataItem.push(item.email || 'N/A');
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
