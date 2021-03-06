import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectBillService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project bills
	* @param {number} projectId
	* @return {Observable}
	*/
	public getAll( projectId?: number ): Observable<any> {
		const params: any = {};

		if ( projectId ) params.project_id = projectId;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/list',
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
	* Get project bill
	* @param {number} id
	* @return {Observable}
	*/
	public getOne( id?: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project-bill/' + id )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Create project bill
	* @param {any} data - project data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_id				: data.project_id,
			name					: data.name,
			total					: data.total,
			total_vat				: data.total_vat,
			expected_invoice_date	: data.expected_invoice_date,
			transfer_type			: data.transfer_type,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/create',
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
	* Update project bill
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			name					: data.name,
			total					: data.total,
			total_vat				: data.total_vat,
			expected_invoice_date	: data.expected_invoice_date,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/update/' + id,
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
	* Update project bill invoice
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
				'/api/finance/project-bill/update-invoice/' + id,
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
	* Update project bill status
	* @param {any} id - project payment id to update
	* @param {any} data - project payment data to update
	* @return {Observable}
	*/
	public updateStatus( id: number, data: any ): Observable<any> {
		const params: any = {
			status			: data.status,
			total_real		: data.total_real,
			total_vat_real	: data.total_vat_real,
			received_date	: data.received_date,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/update-status/' + id,
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
	* Update project bill finance note
	* @param {any} id - project bill id to update
	* @param {any} data - project bill data to update
	* @return {Observable}
	*/
	public updateFinanceNote( id: number, data: any ): Observable<any> {
		const params: any = { finance_note: data.finance_note };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/update-finance-note/' + id,
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
				'/api/finance/project-bill/update-procedures/' + id,
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
	* Delete project bill
	* @param {number} id - Project id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-bill/delete/' + id,
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
				'/api/finance/project-bill/download-invoice',
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
				'/api/finance/project-bill/download-procedure',
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

}
