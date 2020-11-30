import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class VOService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get projects
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
				'/api/finance/project-vo/list',
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
	* Get project vo detail
	* @param {number} id
	* @param {string} query
	* @return {Observable}
	*/
	public getOne( id: number, query?: string ): Observable<any> {
		const params: any = {};

		if ( query ) params.query_for = query;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/' + id,
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
	* Get project vo sum quotation
	* @param {number} projectId
	* @param {string} query
	* @return {Observable}
	*/
	public getSumQuotation( projectId: number): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project-vo/sum-quotation/' + projectId )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Create project vo
	* @param {any} data - vo data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_id		: data.project_id,
			name			: data.name,
			note			: data.note,
			vat_percent		: data.vat_percent,
			discount_type	: data.discount_type,
			discount_amount	: data.discount_amount,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/create',
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
	* Update project vo
	* @param {any} id - vo id to update
	* @param {any} data - vo data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id		: data.project_id,
			name			: data.name,
			note			: data.note,
			vat_percent		: data.vat_percent,
			discount_type	: data.discount_type,
			discount_amount	: data.discount_amount,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/update/' + id,
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
	* Remove items project vo
	* @param {number} id
	* @param {any} params
	* @return {Observable}
	*/
	public getApproval( id: number, params: any ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/get-approval/' + id,
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
	* approve
	* @param {number} id
	* @param {any} params
	* @return {Observable}
	*/
	public approve( id: number, params: any ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/approve/' + id,
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
	* Remove items project vo
	* @param {any} id - vo id to update
	* @param {Array} data - vo items to remove
	* @return {Observable}
	*/
	public removeItem( id: number, data: any ): Observable<any> {
		const params: any = {
			items: data,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/remove-items/' + id,
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
	* Remove items project vo
	* @param {any} id - vo id to update
	* @param {Array} data - vo items to remove
	* @return {Observable}
	*/
	public removeItemCost( id: number, data: any ): Observable<any> {
		const params: any = {
			items: data,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/remove-items-cost/' + id,
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
	* Remove items project vo
	* @param {number} id - vo id to update
	* @param {number} lineItemId
	* @return {Observable}
	*/
	public removeLine( id: number, lineItemId: number ): Observable<any> {
		const params: any = {
			line_item_id: lineItemId,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/remove-line/' + id,
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
	* Remove items project vo
	* @param {number} id - vo id to update
	* @param {number} costItemId
	* @return {Observable}
	*/
	public removeCost( id: number, costItemId: number ): Observable<any> {
		const params: any = {
			cost_item_id: costItemId,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/remove-cost/' + id,
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
	* Delete project vo
	* @param {number} id - vo id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-vo/delete/' + id,
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
