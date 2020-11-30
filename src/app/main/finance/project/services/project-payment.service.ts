import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectPaymentService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project payments
	* @param {string} queryFor
	* @param {number} projectId
	* @return {Observable}
	*/
	public getAll( queryFor?: string, projectId?: number ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;
		if ( projectId ) params.project_id = projectId;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/list',
				'GET',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Get project payment
	* @param {number} id
	* @return {Observable}
	*/
	public getOne( id?: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project-payment/' + id )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Create project payment
	* @param {any} data - project data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_id					: data.project_id,
			project_purchase_order_id	: data.project_purchase_order_id,
			name						: data.name,
			total						: data.total,
			total_vat					: data.total_vat,
			invoice_number				: data.invoice_number,
			invoice_date				: data.invoice_date,
			new_invoice					: data.new_invoice || null,
			transfer_type				: data.transfer_type,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/create',
				'POST',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project payment invoice
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updateInvoice( id: number, data: any ): Observable<any> {
		const params: any = {
			new_invoice		: data.new_invoice,
			invoice_date	: data.invoice_date,
			invoice_number	: data.invoice_number,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-invoice/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project payment order
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updatePaymentOrder( id: number, data: any ): Observable<any> {
		const params: any = {
			new_payment_order	: data.new_payment_order,
			payment_order_date	: data.payment_order_date,
			payment_order_number: data.payment_order_number,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-payment-order/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project payment status
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updateStatus( id: number, data: any ): Observable<any> {
		const params: any = {
			status			: data.status,
			total_real		: data.total_real,
			total_vat_real	: data.total_vat_real,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-status/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project payment approve status
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updateApproveStatus( id: number, data: any ): Observable<any> {
		const params: any = { status: data.status };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-approve-status/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project payment finance note
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updateFinanceNote( id: number, data: any ): Observable<any> {
		const params: any = { finance_note: data.finance_note };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-finance-note/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update procedures
	* @param {any} id - project bill id to update
	* @param {any} data - procedure data to update
	* @return {Observable}
	*/
	public updateProcedures( id: number, data: any ): Observable<any> {
		const params: any = data;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/update-procedures/' + id,
				'PUT',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Delete project payment
	* @param {number} id - Project id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/delete/' + id,
				'DELETE'
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Download invoice
	* @param {object} data - data to download
	* @return {Observable}
	*/
	public downloadInvoice( data: any ): Observable<any> {
		const params: any = {};

		if ( data.key ) params.key = data.key;
		if ( data.url ) params.url = data.url;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/download-invoice',
				'POST',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Download invoice
	* @param {object} data - data to download
	* @return {Observable}
	*/
	public downloadPaymentOrder( data: any ): Observable<any> {
		const params: any = {};

		if ( data.key ) params.key = data.key;
		if ( data.url ) params.url = data.url;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/download-payment-order',
				'POST',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Download procedure
	* @param {object} data - data to download
	* @return {Observable}
	*/
	public downloadProcedure( data: any ): Observable<any> {
		const params: any = {};

		if ( data.key ) params.key = data.key;
		if ( data.url ) params.url = data.url;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/download-procedure',
				'POST',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Get project total purchase order
	* @param {number} id - Project payment id
	* @param {number} projectId - Project id
	* @param {number} poId - Project purchase order id
	* @return {Observable}
	*/
	public getTotalPO( id: number, projectId: number, poId: number ): Observable<any> {
		const params: any = {
			project_payment_id			: id,
			project_id					: projectId,
			project_purchase_order_id	: poId,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-payment/total-po',
				'GET',
				params
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
