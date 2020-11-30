import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class VendorService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get vendors
	* @param {string} queryFor
	* @param {number} queryCategoryId
	* @return {Observable}
	*/
	public getAll( queryFor?: string, queryCategoryId?: number ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;
		if ( queryCategoryId ) params.query_category_id = queryCategoryId;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor/list',
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
	* Create vendor
	* @param {any} data - Vendor data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			vendor_category_id	: data.vendor_category_id,
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
				'/api/finance/vendor/create',
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
	* Update vendor
	* @param {number} id - Vendor id to update
	* @param {any} data - Vendor data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			vendor_category_id	: data.vendor_category_id,
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
				'/api/finance/vendor/update/' + id,
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
	* Delete vendor
	* @param {number} id - Vendor id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor/delete/' + id,
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
