import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ClientService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get clients
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getAll( queryFor?: string ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/client/list',
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
	* Create client
	* @param {any} data - Client data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			lezo_client_id		: data.lezo_client_id,
			name				: data.name,
			short_name			: data.short_name,
			phone				: data.phone,
			tax					: data.tax,
			address				: data.address,
			bank_name			: data.bank_name,
			bank_province		: data.bank_province,
			bank_branch			: data.bank_branch,
			bank_account_number	: data.bank_account_number,
			payment_term		: +data.payment_term,
			description			: data.description,
			contact_list		: data.contact_list,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/client/create',
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
	* Update client
	* @param {number} id - Client id to update
	* @param {any} data - Client data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			name				: data.name,
			short_name			: data.short_name,
			phone				: data.phone,
			tax					: data.tax,
			address				: data.address,
			bank_name			: data.bank_name,
			bank_province		: data.bank_province,
			bank_branch			: data.bank_branch,
			bank_account_number	: data.bank_account_number,
			payment_term		: +data.payment_term,
			description			: data.description,
			is_disabled			: data.is_disabled,
			contact_list		: data.contact_list,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/client/update/' + id,
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
	* Delete client
	* @param {number} id - Client id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/client/delete/' + id,
				'DELETE'
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

}
