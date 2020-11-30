import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectPurchaseOrderService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get projects
	* @param {number} projectId
	* @return {Observable}
	*/
	public getAll( projectId: number ): Observable<any> {
		const params: any = { project_id: projectId };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/list',
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
	* Get project purchase order
	* @param {number} id
	* @param {number} projectId
	* @return {Observable}
	*/
	public getOne( id: number, projectId: number ): Observable<any> {
		const params: any = { project_id: projectId };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/' + id,
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
	* Create project sheet
	* @param {any} data - sheet data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_id			: data.project_id,
			vat_percent			: data.vat_percent,
			vendor_id			: data.selected_cost_items[ 0 ].vendor_id,
			name				: data.name,
			description			: data.description,
			discount_type		: data.discount_type,
			discount_amount		: data.discount_amount,
			note				: data.note,
			selected_cost_items	: data.selected_cost_items,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/create',
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
	* Update
	* @param {any} id
	* @param {any} data
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id			: data.project_id,
			vat_percent			: data.vat_percent,
			vendor_id			: data.selected_cost_items[ 0 ].vendor_id,
			name				: data.name,
			description			: data.description,
			discount_type		: data.discount_type,
			discount_amount		: data.discount_amount,
			note				: data.note,
			selected_cost_items	: data.selected_cost_items,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/update/' + id,
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
	* modify
	* @param {any} id
	* @param {any} data
	* @return {Observable}
	*/
	public modify( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id			: data.project_id,
			vat_percent			: data.vat_percent,
			vendor_id			: data.selected_cost_items[ 0 ].vendor_id,
			name				: data.name,
			description			: data.description,
			discount_type		: data.discount_type,
			discount_amount		: data.discount_amount,
			note				: data.note,
			selected_cost_items	: data.selected_cost_items,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/modify/' + id,
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
	* Update project purchase order status
	* @param {number} id
	* @param {number} status
	* @return {Observable}
	*/
	public changeStatus( id: number, status: number ): Observable<any> {
		const params: any = { status };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/change-status/' + id,
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
	* Update project purchase order status
	* @param {number} id
	* @param {number} status
	* @return {Observable}
	*/
	public freezePO( id: number, status: number ): Observable<any> {
		const params: any = { status };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/change-freeze/' + id,
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
	* Delete PO
	* @param {number} id
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-purchase-order/delete/' + id,
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
