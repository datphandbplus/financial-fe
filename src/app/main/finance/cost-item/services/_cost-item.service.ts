// import { Injectable } from '@angular/core';
// import { Observable, Observer } from 'rxjs';

// import { ApiService } from '@core';

// @Injectable()
// export class CostItemService {

// 	/**
// 	* @constructor
// 	* @param {ApiService} apiService
// 	*/
// 	constructor( private apiService: ApiService ) {}

// 	/**
// 	* Get cost items
// 	* @param {string} queryFor
// 	* @param {number} id
// 	* @return {Observable}
// 	*/
// 	public getAll( queryFor?: string, id?: number ): Observable<any> {
// 		const params: any = {};

// 		if ( queryFor ) params.query_for = queryFor;
// 		if ( id ) params.line_item_id = id;

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/cost-item/list',
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
// 	* Create cost item
// 	* @param {any} data - Cost item data to create
// 	* @return {Observable}
// 	*/
// 	public create( data: any ): Observable<any> {
// 		const params: any = {
// 			cost_item_category_id	: data.cost_item_category_id,
// 			line_item_id			: data.line_item_id,
// 			name					: data.name,
// 			unit					: data.unit,
// 			price					: +data.price,
// 			vat						: +data.vat,
// 			description				: data.description,
// 		};

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/cost-item/create',
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
// 	* Update cost item
// 	* @param {number} id - Cost item id to update
// 	* @param {any} data - Cost item data to update
// 	* @return {Observable}
// 	*/
// 	public update( id: number, data: any ): Observable<any> {
// 		const params: any = {
// 			cost_item_category_id	: data.cost_item_category_id,
// 			line_item_id			: data.line_item_id,
// 			name					: data.name,
// 			unit					: data.unit,
// 			price					: +data.price,
// 			vat						: +data.vat,
// 			description				: data.description,
// 			is_disabled				: data.is_disabled,
// 		};

// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/cost-item/update/' + id,
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
// 	* Delete cost item
// 	* @param {number} id - Cost item id to delete
// 	* @return {Observable}
// 	*/
// 	public delete( id: number ): Observable<any> {
// 		return new Observable( ( observer: Observer<any> ) => {
// 			this.apiService
// 			.call(
// 				'/api/finance/cost-item/delete/' + id,
// 				'DELETE'
// 			)
// 			.subscribe(
// 				( result: any ) => observer.next( result ),
// 				( error: any ) => observer.error( error )
// 			);
// 		} );
// 	}

// }
