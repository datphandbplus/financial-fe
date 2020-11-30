import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { ApiService } from '@core';

@Injectable()
export class SheetService {

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
				'/api/finance/project-sheet/list',
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
	* Get project sheet detail
	* @param {number} id
	* @return {Observable}
	*/
	public getOne( id?: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call( '/api/finance/project-sheet/' + id )
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
			project_id	: data.project_id,
			name		: data.name,
			description	: data.description,
			note		: data.note,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-sheet/create',
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
	* Update project sheet
	* @param {any} id - sheet id to update
	* @param {any} data - sheet data to update
	* @return {Observable}
	*/
	public update( id: number, data: any ): Observable<any> {
		const params: any = {
			project_id	: data.project_id,
			name		: data.name,
			description	: data.description,
			note		: data.note,
		};

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-sheet/update/' + id,
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
	* Update project sheet status
	* @param {any} id - sheet id to update
	* @param {boolean} isDone - sheet status to update
	* @return {Observable}
	*/
	public updateStatus( id: number, isDone: boolean ): Observable<any> {
		const params: any = { is_done: isDone };

		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-sheet/update-status/' + id,
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
	* Delete project sheet
	* @param {number} id - sheet id to delete
	* @return {Observable}
	*/
	public delete( id: number ): Observable<any> {
		return new Observable( ( observer: Observer<any> ) => {
			this.apiService
			.call(
				'/api/finance/project-sheet/delete/' + id,
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
