import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import _ from 'underscore';
import moment from 'moment-timezone';

import {
	COLORS, QUOTATION_STATUS,
	BILL_STATUS, PAYMENT_STATUS
} from '@resources';
import { FinanceBaseComponent } from '@finance/finance-base.component';
import { AccountService } from '@account/services/account.service';

export class ProjectBaseComponent extends FinanceBaseComponent {

	public projectId: number;
	public loaded: boolean;
	public project: any = {};
	public quotationStatus: Array<any> = [
		{
			id		: 0,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.ACCENT,
		},
		{
			id		: 1,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: 2,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: 3,
			key		: 'CANCELLED',
			name	: 'FINANCE.PROJECT.LABELS.CANCELLED',
			color	: COLORS.WARN,
		},
		{
			id		: 4,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
	];
	public planStatus: Array<any> = [
		{
			id		: 0,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.ACCENT,
		},
		{
			id		: 1,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: 2,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: 3,
			key		: 'CANCELLED',
			name	: 'FINANCE.PROJECT.LABELS.CANCELLED',
			color	: COLORS.WARN,
		},
		{
			id		: 4,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
	];
	public projectStatus: Array<any> = [
		{
			id		: 0,
			key		: 'PITCHING',
			name	: 'FINANCE.PROJECT.LABELS.PITCHING',
			color	: COLORS.WARN,
		},
		{
			id		: 1,
			key		: 'CONFIRMED',
			name	: 'FINANCE.PROJECT.LABELS.CONFIRMED',
			color	: COLORS.ACCENT,
		},
		{
			id		: 2,
			key		: 'CONTRACTING',
			name	: 'FINANCE.PROJECT.LABELS.CONTRACTING',
			color	: COLORS.ORGANE,
		},
		{
			id		: 3,
			key		: 'CONTRACTED',
			name	: 'FINANCE.PROJECT.LABELS.CONTRACTED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: 4,
			key		: 'LIQUIDATION',
			name	: 'FINANCE.PROJECT.LABELS.LIQUIDATION',
			color	: COLORS.PINK,
		},
		{
			id		: 5,
			key		: 'PAYMENT_RECEIVED',
			name	: 'FINANCE.PROJECT.LABELS.PAYMENT_RECEIVED',
			color	: COLORS.GOLD,
		},
		{
			id		: 6,
			key		: 'DELAYED',
			name	: 'FINANCE.PROJECT.LABELS.DELAYED',
			color	: COLORS.WARNING,
		},
		{
			id		: 7,
			key		: 'FAIL',
			name	: 'FINANCE.PROJECT.LABELS.FAIL',
			color	: COLORS.BLACK,
		},
		{
			id		: 8,
			key		: 'DROPPED',
			name	: 'FINANCE.PROJECT.LABELS.DROPPED',
			color	: COLORS.GREY,
		},
		{
			id		: 9,
			key		: 'DONE',
			name	: 'FINANCE.PROJECT.LABELS.DONE',
			color	: COLORS.SUCCESS,
		},
	];
	public receivableStatus: Array<any> = [
		{
			id		: 0,
			key		: 'WAITING',
			name	: 'FINANCE.PROJECT.LABELS.WAITING',
			color	: COLORS.WARNING,
			priority: 4,
		},
		{
			id		: 1,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.PRIMARY,
			priority: 3,
		},
		{
			id		: 2,
			key		: 'INVOICE_SENT',
			name	: 'FINANCE.PROJECT.LABELS.INVOICE_SENT',
			color	: COLORS.ACCENT,
			priority: 1,
		},
		{
			id		: 3,
			key		: 'MONEY_COLLECTED',
			name	: 'FINANCE.PROJECT.LABELS.MONEY_COLLECTED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 4,
			key		: 'DELAYED',
			name	: 'FINANCE.PROJECT.LABELS.DELAYED',
			color	: COLORS.WARN,
			priority: 2,
		},
	];
	public payableStatus: Array<any> = [
		{
			id		: 0,
			key		: 'WAITING',
			name	: 'FINANCE.PROJECT.LABELS.WAITING',
			color	: COLORS.WARNING,
			priority: 3,
		},
		{
			id		: 1,
			key		: 'CONFIRMED',
			name	: 'FINANCE.PROJECT.LABELS.CONFIRMED',
			color	: COLORS.ACCENT,
			priority: 1,
		},
		{
			id		: 2,
			key		: 'PAID',
			name	: 'FINANCE.PROJECT.LABELS.PAID',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 3,
			key		: 'DELAYED',
			name	: 'FINANCE.PROJECT.LABELS.DELAYED',
			color	: COLORS.WARN,
			priority: 2,
		},
	];
	public paymentApproveStatus: Array<any> = [
		{
			id		: 0,
			key		: 'PROCESSING',
			name	: 'FINANCE.PROJECT.LABELS.PROCESSING',
			color	: COLORS.ACCENT,
			priority: 3,
		},
		{
			id		: 1,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
			priority: 1,
		},
		{
			id		: 2,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
			priority: 0,
		},
		{
			id		: 3,
			key		: 'CANCELLED',
			name	: 'FINANCE.PROJECT.LABELS.CANCELLED',
			color	: COLORS.WARN,
			priority: 3,
		},
		{
			id		: 4,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
			priority: 2,
		},
	];
	public projectCostModificationStatus: Array<any> = [
		{
			id		: 0,
			key		: 'WAITING_APPROVAL',
			name	: 'FINANCE.PROJECT.LABELS.WAITING_APPROVAL',
			color	: COLORS.WARNING,
		},
		{
			id		: 1,
			key		: 'APPROVED',
			name	: 'FINANCE.PROJECT.LABELS.APPROVED',
			color	: COLORS.SUCCESS,
		},
		{
			id		: 2,
			key		: 'VALID',
			name	: 'FINANCE.PROJECT.LABELS.VALID',
			color	: COLORS.ACCENT,
		},
		{
			id		: 3,
			key		: 'REJECTED',
			name	: 'FINANCE.PROJECT.LABELS.REJECTED',
			color	: COLORS.WARN,
		},
		{
			id		: 4,
			key		: 'REMOVED',
			name	: 'FINANCE.PROJECT.LABELS.REMOVED',
			color	: COLORS.WARN,
		},
	];

	/**
	* @constructor
	* @param {Injector} injector
	*/
	constructor( public injector: Injector ) {
		super( injector );
	}

	/**
	* View project detail
	* @param {any} project - Project need view detail
	* @param {any} params
	* @return {void}
	*/
	public navigateViewProjectDetail( project: any, params: any = {} ) {
		const router: Router = this.injector.get( Router );

		router.navigate( [ 'finance/project/detail/' + project.id ], { queryParams: params } );
	}

	/**
	* Custom sort data source
	* @param {any} dataSourceClone
	* @param {boolean} isExpand
	* @return {array}
	*/
	public customSortDataSource( dataSourceClone: any, isExpand?: boolean ) {
		const data: Array<any> = _.clone( dataSourceClone );

		data.sort( ( a: any, b: any ) => b.status_name.priority - a.status_name.priority || a.count_day - b.count_day );

		if ( !isExpand ) return data;

		const tempData: Array<any> = [];

		_.map( data , ( item: any ) => {
			item.show_detail_row = item.show_detail_row || false;

			tempData.push(
				item,
				{
					payment		: item,
					detail_row	: true,
				}
			);
		} );

		return tempData;
	}

	/**
	* Get Receivable date and count day
	* @param {any} item
	* @return {void}
	*/
	public getReceivableDateAndCountDay( item: any ) {
		const minDate: any = moment();

		item.expected_invoice_date = moment( item.expected_invoice_date );
		item.status_name = _.findWhere( this.receivableStatus, { id: item.status } ); // Receivable status

		const receivableDate: any = item.expected_invoice_date.clone().add( +item.project.client_payment_term, 'd' );

		if ( item.status !== BILL_STATUS.MONEY_COLLECTED ) {
			const countDay: number = receivableDate.diff( minDate, 'd' );

			item.receivable_date = receivableDate;
			item.count_day = countDay;

			if ( countDay < 0 ) item.status_name = _.findWhere( this.receivableStatus, { id: 4 } ); // Delayed
		} else {
			const receivedDate: any = moment( item.received_date );
			const expectedInvoiceDate: any = moment( item.expected_invoice_date );

			let countDay: number = expectedInvoiceDate.diff( receivedDate, 'd' );

			if ( item.invoices && item.invoices.length ) {
				const invoiceDate: any = moment( item.invoice_date );
				countDay = invoiceDate.diff( receivedDate, 'd' );
			}

			item.receivable_date = receivedDate;
			item.count_day = countDay;
		}
	}

	/**
	* Get Pay date and count day
	* @param {any} item
	* @return {void}
	*/
	public getPayDateAndCountDay( item: any ) {
		const minDate: any = moment();

		item.invoice_date = moment( item.invoice_date );
		item.status_name = _.findWhere( this.payableStatus, { id: item.status } ); // Payment status
		item.approve_status_name = _.clone( _.findWhere( this.paymentApproveStatus, { id: item.approve_status } ) ); // Payment approve status

		const payDate: any = item.invoice_date.clone().add( +item.vendor_payment_term, 'd' );

		if ( item.status !== PAYMENT_STATUS.PAID ) {
			const countDay: number = payDate.diff( minDate.startOf( 'd' ), 'd' );

			item.pay_date = payDate;
			item.count_day = countDay;

			if ( countDay < 0 ) item.status_name = _.findWhere( this.payableStatus, { id: 3 } ); // Delayed
		} else {
			const paidDate: any = moment( item.paid_date );
			let countDay: number = payDate.diff( paidDate.startOf( 'd' ), 'd' );

			if ( item.payment_orders && item.payment_orders.length ) {
				const paymentOrderDate: any = moment( item.payment_order_date );
				countDay = paymentOrderDate.diff( paidDate.clone().startOf( 'd' ), 'd' );
			}

			item.pay_date = paidDate;
			item.count_day = countDay;
		}
	}

	/**
	* Can manage project
	* @param {any} project
	* @return {booelean}
	*/
	public canManage( project: any ): boolean {
		const accountService: AccountService = this.injector.get( AccountService );

		return accountService.isCEO()
			// || ( accountService.isQS() && project.qs_by === this.account.id )
			// || ( accountService.isPM() && project.manage_by === this.account.id )
			|| ( accountService.isSale() && project.sale_by === this.account.id );
	}

	/**
	* Can edit project
	* @param {any} project
	* @return {booelean}
	*/
	public canEdit( project: any ): boolean {
		return this.canManage( project )
			&& ( project.quotation_status === QUOTATION_STATUS.PROCESSING
				|| project.quotation_status === QUOTATION_STATUS.CANCELLED );
	}

}
