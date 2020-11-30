import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class VendorCategoryService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get vendor categories
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getAll( queryFor?: string ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor-category/list',
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
	* Create vendor category
	* @param {any} vendorCategoryData - Vendor category data to create
	* @return {Observable}
	*/
	public create( vendorCategoryData: any ): Observable<any> {
		const params: any = {
			name		: vendorCategoryData.name,
			description	: vendorCategoryData.description,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor-category/create',
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
	* Update vendor category
	* @param {number} vendorCategoryId - Vendor category id to update
	* @param {any} vendorCategoryData - Vendor category data to update
	* @return {Observable}
	*/
	public update( vendorCategoryId: number, vendorCategoryData: any ): Observable<any> {
		const params: any = {
			name		: vendorCategoryData.name,
			description	: vendorCategoryData.description,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor-category/update/' + vendorCategoryId,
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
	* Delete vendor category
	* @param {number} vendorCategoryId - Vendor category id to delete
	* @return {Observable}
	*/
	public delete( vendorCategoryId: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/vendor-category/delete/' + vendorCategoryId,
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
