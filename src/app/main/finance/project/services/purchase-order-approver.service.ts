import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class PurchaseOrderApproverService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get projects
	* @param {number} purchaseOrderId
	* @return {Observable}
	*/
	public getAll( purchaseOrderId: number ): Observable<any> {
		const params: any = {};
		params.project_purchase_order_id = purchaseOrderId;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/purchase-order-approver/list',
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
	* Update
	* @param {number} id
	* @param {any} data
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			user_id	: data.user_id,
			status  : data.status,
			comment	: data.comment,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/purchase-order-approver/update/' + id,
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

}
