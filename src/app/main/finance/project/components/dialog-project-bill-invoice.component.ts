import {
	Component, Inject, OnInit,
	OnDestroy, Injector
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { SnackBarService } from 'angular-core';
import _ from 'underscore';

import { FinanceBaseComponent } from '@finance/finance-base.component';
import { ProjectBillService } from '@finance/project/services/project-bill.service';
import { AccountService } from '@account/services/account.service';

@Component({
	selector	: 'dialog-project-bill-invoice',
	templateUrl	: '../templates/dialog-project-bill-invoice.pug',
})
export class DialogProjectBillInvoiceComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

	public bill: any = {};

	/**
	* @constructor
	* @param {any} data
	* @param {MatDialogRef} dialogRef
	* @param {Injector} injector
	* @param {SnackBarService} snackBarService
	* @param {ProjectBillService} projectBillService
	* @param {AccountService} accountService
	*/
	constructor(
		@Inject( MAT_DIALOG_DATA ) public data: any,
		public dialogRef			: MatDialogRef<DialogProjectBillInvoiceComponent>,
		public injector				: Injector,
		public snackBarService		: SnackBarService,
		public projectBillService	: ProjectBillService,
		public accountService		: AccountService
	) {
		super( injector );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		this.data && _.assign( this.bill, this.data );
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

}
