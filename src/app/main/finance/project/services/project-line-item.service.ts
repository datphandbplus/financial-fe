import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class ProjectLineItemService {

	/**
	* @constructor
	* @param {ApiService} apiService
	*/
	constructor( private apiService: ApiService ) {}

	/**
	* Get project line items
	* @param {string} queryFor
	* @param {any} queryOptions
	* @return {Observable}
	*/
	public getAll( queryFor?: string, queryOptions?: any ): Observable<any> {
		const params: any = {};

		if ( queryFor ) params.query_for = queryFor;
		if ( queryOptions.project_sheet_id ) params.project_sheet_id = queryOptions.project_sheet_id;
		if ( queryOptions.project_id ) params.project_id = queryOptions.project_id;
		if ( queryOptions.vo_id ) params.vo_id = queryOptions.vo_id;

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/list',
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
	* Get project line item
	* @param {number} id
	* @return {Observable}
	*/
	public getOne( id?: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project-line-item/' + id )
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Create project line item
	* @param {any} data - Project line item data to create
	* @return {Observable}
	*/
	public create( data: any ): Observable<any> {
		const params: any = {
			project_sheet_id		: data.project_sheet_id,
			vo_add_id				: data.vo_add_id,
			group					: data.group,
			child_group				: data.child_group,
			line_item_category_id	: data.line_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: +data.amount,
			price					: +data.price,
			description				: data.description,
			note					: data.note,
			image					: data.image,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/create',
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
	* Update project line item
	* @param {any} id - Project line item id to update
	* @param {any} data - Project line item data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			project_sheet_id		: data.project_sheet_id,
			vo_add_id				: data.vo_add_id,
			group					: data.group,
			child_group				: data.child_group,
			line_item_category_id	: data.line_item_category_id,
			name					: data.name,
			unit					: data.unit,
			amount					: +data.amount,
			price					: +data.price,
			description				: data.description,
			note					: data.note,
			image					: data.image,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/update/' + id,
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
	* Update project line item priority
	* @param {any} projectSheetId - sheet id to update
	* @param {any} data - Priority data to update
	* @return {Observable}
	*/
	public updatePriority( projectSheetId: number, data: any ): Observable<any> {
		const params: any = {
			project_sheet_id: projectSheetId,
			list			: data,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/update-priority',
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
	* Download template
	* @return {Observable}
	*/
	public download(): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/download',
				'GET'
			)
			.subscribe(
				( result: any ) => observer.next( result ),
				( error: any ) => observer.error( error ),
				() => observer.complete()
			);
		} );
	}

	/**
	* Upload project line items file
	* @param {File} file - File to upload
	* @param {number} id - project id to upload
	* @param {string} action
	* @return {Observable}
	*/
	public upload( file: File, id: any, action: string = 'addnew' ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			let queryString: string = '?project_id=' + id.project_id + '&action=' + action;

			id
			&& id.vo_id
			&& ( queryString += '&vo_id=' + id.vo_id );

			this.apiService
			.upload(
				'/api/finance/project-line-item/upload' + queryString,
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
	* Upload project line item image
	* @param {File} file - File to upload
	* @return {Observable}
	*/
	public uploadImage( file: File ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.upload(
				'/api/finance/project-line-item/upload-image',
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
	* Delete project line item
	* @param {number} id - Project line item id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-line-item/delete/' + id,
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
