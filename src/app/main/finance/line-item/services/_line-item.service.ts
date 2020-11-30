// import { Injectable } from '@angular/core';
// import { Observable, Observer } from 'rxjs';

// import { ApiService } from '@core';

// @Injectable()
// export class LineItemService {

// 	/**
// 	* @constructor
// 	* @param {ApiService} apiService
// 	*/
// 	constructor( private apiService: ApiService ) {}

// 	/**
// 	* Get line items
// 	* @param {string} queryFor
// 	* @param {number} categoryId - Line Item Category id
// 	* @return {Observable}
// 	*/
// 	public getAll( queryFor?: string, categoryId?: number ): Observable<any> {
// 		const params: any = {};

// 		if ( queryFor ) params.query_for = queryFor;
// 		if ( categoryId ) params.category_id = categoryId;

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/line-item/list',
// 				'GET',
// 				params
// 			)
// 			.subscribe(
// 				( result: any ) => observer.next( result ),
// 				( error: any ) => observer.error( error )
// 			);
// 		} );
// 	}

// 	/**
// 	* Create line item
// 	* @param {any} data - Line item data to create
// 	* @return {Observable}
// 	*/
// 	public create( data: any ): Observable<any> {
// 		const params: any = {
// 			line_item_category_id	: data.line_item_category_id,
// 			name					: data.name,
// 			unit					: data.unit,
// 			price					: +data.price,
// 			vat						: +data.vat,
// 			has_wht					: data.has_wht,
// 			description				: data.description,
// 		};

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/line-item/create',
// 				'POST',
// 				params
// 			)
// 			.subscribe(
// 				( result: any ) => observer.next( result ),
// 				( error: any ) => observer.error( error )
// 			);
// 		} );
// 	}

// 	/**
// 	* Update line item
// 	* @param {number} id - Line item id to update
// 	* @param {any} data - Line item data to update
// 	* @return {Observable}
// 	*/
// 	public update( id: number, data: any ): Observable<any> {
// 		const params: any = {
// 			line_item_category_id	: data.line_item_category_id,
// 			name					: data.name,
// 			unit					: data.unit,
// 			price					: +data.price,
// 			vat						: +data.vat,
// 			description				: data.description,
// 			has_wht					: data.has_wht,
// 			is_disabled				: data.is_disabled,
// 		};

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/line-item/update/' + id,
// 				'PUT',
// 				params
// 			)
// 			.subscribe(
// 				( result: any ) => observer.next( result ),
// 				( error: any ) => observer.error( error )
// 			);
// 		} );
// 	}

// 	/**
// 	* Delete line item
// 	* @param {number} id - Line item id to delete
// 	* @return {Observable}
// 	*/
// 	public delete( id: number ): Observable<any> {
// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/line-item/delete/' + id,
// 				'DELETE'
// 			)
// 			.subscribe(
// 				( result: any ) => observer.next( result ),
// 				( error: any ) => observer.error( error )
// 			);
// 		} );
// 	}

// }
