import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie';
import _ from 'underscore';

import { HASH } from '@environments/hash';

@Component({
	selector: 'sync-token',
	template: '',
})
export class SyncTokenComponent implements OnDestroy {

	public sub: any;

	/**
	* @constructor
	* @param {ActivatedRoute} route
	* @param {Router} router
	* @param {CookieService} cookies
	*/
	constructor(
		public route	: ActivatedRoute,
		public router	: Router,
		public cookies	: CookieService
	) {
		this.sub = this.route.queryParams.subscribe( ( queryParams: any ) => {
			queryParams.token && this.cookies.put( HASH.AUTHORIZED_KEY, queryParams.token );
			this.router.navigate( [ '/login' ] );
		} );
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		this.sub && _.isFunction( this.sub.unsubscribe ) && this.sub.unsubscribe();
	}

}
