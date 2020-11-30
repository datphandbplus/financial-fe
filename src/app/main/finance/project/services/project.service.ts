import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project statistic
	* @param {any} start
	* @param {any} end
	* @param {string} type
	* @param {number} id
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getStatistic(
		start: any, end: any, type?: string,
		id?: number, queryFor?: string
	): Observable<any> {
		const params: any = { start, end };

		if ( type ) params.type = type;
		if ( id ) params.id = id;
		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/statistic',
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
	* Get project dashboard statistic
	* @param {any} start
	* @param {any} end
	* @param {string} type
	* @param {Array} ids
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getDashboardStatistic(
		start: any, end: any, type?: string,
		ids?: Array<number>, queryFor?: string
	): Observable<any> {
		const params: any = { start, end };

		if ( type ) params.type = type;
		if ( ids ) params.ids = ids;
		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/dashboard-statistic',
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
	* Get project statistic receivable and receivable plan
	* @param {any} start
	* @param {any} end
	* @param {string} type
	* @param {number} id
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getStatisticRRP(
		start: any, end: any, type?: string,
		id?: number, queryFor?: string
	): Observable<any> {
		const params: any = { start, end };

		if ( type ) params.type = type;
		if ( id ) params.id = id;
		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/statistic-rrp',
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
	* Get dashboard statistic receivable and receivable plan
	* @param {any} start
	* @param {any} end
	* @param {string} type
	* @param {Array} ids
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getDashboardStatisticRRP(
		start: any, end: any, type?: string,
		ids?: Array<number>, queryFor?: string
	): Observable<any> {
		const params: any = { start, end };

		if ( type ) params.type = type;
		if ( ids ) params.ids = ids;
		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/dashboard-statistic-rrp',
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
	* Get projects
	* @param {string} queryFor
	* @param {any} start
	* @param {any} end
	* @return {Observable}
	*/
	public getAll( queryFor?: string, start?: any, end?: any ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;
		if ( start ) params.start = start;
		if ( end ) params.end = end;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/list',
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
	* Get project detail
	* @param {number} id
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getOne( id?: number, queryFor?: string ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/' + id,
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
	* Get project detail
	* @param {number} id
	* @param {string} queryFor
	* @return {Observable}
	*/
	public getWaitingAction( id: number, queryFor?: string ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-waiting-action/' + id,
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
	* Download project export
	* @param {number} id
	* @return {Observable}
	*/
	public downloadExport( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project/export/' + id )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Create project
	* @param {any} data - project data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			lezo_project_id	: data.lezo_project_id,
			name			: data.name,
			manage_by		: data.manage_by,
			client_id		: data.client_id,
			valid_duration	: +data.valid_duration,
			contact			: data.contact,
			address			: data.address,
			project_start	: data.project_start,
			project_end		: data.project_end,
			quotation_date	: data.quotation_date,
			quotation_note	: data.quotation_note,
			sale_by			: data.sale_by,
			qs_by			: data.qs_by,
			construct_by	: data.construct_by,
			purchase_by		: data.purchase_by,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/create',
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
	* Update project
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			name			: data.name,
			manage_by		: data.manage_by,
			client_id		: data.client_id,
			valid_duration	: +data.valid_duration,
			contact			: data.contact,
			address			: data.address,
			project_start	: data.project_start,
			project_end		: data.project_end,
			quotation_date	: data.quotation_date,
			quotation_note	: data.quotation_note,
			sale_by			: data.sale_by,
			qs_by			: data.qs_by,
			construct_by	: data.construct_by,
			purchase_by		: data.purchase_by,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/update/' + id,
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
	* Update quotation status
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public updateQuotationStatus( id: number, data: any ): Observable<any> {
		const params: any = {
			quotation_status: data.quotation_status,
			comment			: data.comment,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/update-quotation-status/' + id,
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
	* Update plan status
	* @param {any} id - project id to update
	* @param {any} data - plan data to update
	* @param {string} type - bill / payment
	* @return {Observable}
	*/
	public updatePlanStatus( id: number, data: any, type: string ): Observable<any> {
		const params: any = {};
		if ( type === 'bill' ) {
			params.bill_plan_status = data.status;
			params.bill_plan_comment = data.comment;
		} else {
			params.payment_plan_status = data.status;
			params.payment_plan_comment = data.comment;
		}

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/update-' + type + '-plan-status/' + id,
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
	* Upload project invoice
	* @param {File} file - File to upload
	* @return {Observable}
	*/
	public uploadInvoice( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/project/upload-invoice',
				file
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Upload payment order
	* @param {File} file - File to upload
	* @return {Observable}
	*/
	public uploadPaymentOrder( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/project/upload-payment-order',
				file
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Upload procedure
	* @param {File} file - File to upload
	* @return {Observable}
	*/
	public uploadProcedure( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/project/upload-procedure',
				file
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Update project status
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public updateProjectConfig( id: number, data: any ): Observable<any> {
		const params: any = {
			project_status	: data.project_status,
			exchange_rate	: data.exchange_rate,
			valid_duration	: data.valid_duration,
			management_fee	: data.management_fee,
			total_extra_fee	: data.total_extra_fee,
			extra_cost_fee	: data.extra_cost_fee,
			max_po_price	: data.max_po_price,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/update-project-config/' + id,
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
	* Delete project
	* @param {number} id - Project id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/delete/' + id,
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
	* Change project user
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public changeProjectUser( id: number, data: any ): Observable<any> {
		const params: any = {
			manage_by	: data.manage_by,
			sale_by		: data.sale_by,
			qs_by		: data.qs_by,
			purchase_by	: data.purchase_by,
			construct_by: data.construct_by || null,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/change-user/' + id,
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
	* Update quotation discount
	* @param {any} id - project id to update
	* @param {any} data - project data to update
	* @return {Observable}
	*/
	public updateQuotationDiscount( id: number, data: any ): Observable<any> {
		const params: any = {
			discount_type	: data.discount_type,
			discount_amount	: data.discount_amount,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project/update-quotation-discount/' + id,
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
