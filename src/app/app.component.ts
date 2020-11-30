import {
	OnInit, OnDestroy, Component,
	AfterViewInit, ChangeDetectorRef, Injector,
	AfterViewChecked, ElementRef
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material';
import { Router, NavigationEnd, NavigationError } from '@angular/router';
import moment from 'moment-timezone';
import _ from 'underscore';

import { BootstrapComponent } from './bootstrap.component';
import { LoginComponent } from './main/auth/components/login.component';
import { PageService } from '@core';
import { ENVIRONMENT } from '@environments/environment';

@Component({
	selector	: 'app',
	templateUrl	: '../templates/app.pug',
})
export class AppComponent extends BootstrapComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

	public win: any;
	public eventId: number = +moment() + _.random( 1, 1000 );

	/**
	* @constructor
	* @param {Injector} injector
	* @param {Router} router
	* @param {TranslateService} translateService
	* @param {PageService} pageService
	* @param {MatDialog} matDialog
	* @param {ChangeDetectorRef} changeDetectorRef
	* @param {ElementRef} elementRef
	*/
	constructor(
		public injector			: Injector,
		public router			: Router,
		public translateService	: TranslateService,
		public pageService		: PageService,
		public matDialog		: MatDialog,
		public changeDetectorRef: ChangeDetectorRef,
		public elementRef		: ElementRef
	) {
		super( injector );

		this.sub = this.router.events.subscribe( ( event: any ) => {
			if ( event instanceof NavigationError ) {
				this.router.navigate( [ '404' ] );
				return;
			}

			if ( event instanceof NavigationEnd ) {
				window.scrollTo( 0, 0 );

				const state: any = router.routerState;
				const title: Array<string> = this.getStateTitle( state, state.root );

				// Set page title
				this.pageService.setTitle( title.length ? title.join( ' - ' ) : ENVIRONMENT.APP_TITLE );

				// Close all dialog
				this.matDialog.closeAll();
			}
		} );
	}

	/**
	* @constructor
	*/
	public ngOnInit() {
		super.ngOnInit();
	}

	/**
	* @constructor
	*/
	public ngOnDestroy() {
		super.ngOnDestroy();
		this.win.unbind( 'resize.viewport-' + this.eventId );
	}

	/**
	* @constructor
	*/
	public ngAfterViewInit() {
		super.ngAfterViewInit();
	}

	/**
	* @constructor
	*/
	public ngAfterViewChecked() {
		this.changeDetectorRef.detectChanges();
	}

	/**
	* Get state title
	* @param {any} state
	* @param {any} parent
	* @return {Array}
	*/
	public getStateTitle( state: any, parent: any ): Array<any> {
		const data: Array<string> = [];

		if ( parent && parent.snapshot.data ) {
			if ( parent.snapshot.data.translate ) {
				data.push( this.translateService.instant( parent.snapshot.data.translate ) );
			} else if ( parent.snapshot.data.title ) {
				data.push( parent.snapshot.data.title );
			}
		}

		if ( state && parent ) {
			data.push( ...this.getStateTitle( state, state.firstChild( parent ) ) );
		}

		return data;
	}

	/**
	* On router outlet activate
	* @param {any} ev
	* @return {void}
	*/
	public onRouterOutletActivate( ev: any ) {
		if ( ev instanceof LoginComponent ) {
			this.elementRef.nativeElement.classList.remove( 'fix-to-left' );
			return;
		}

		this.elementRef.nativeElement.classList.add( 'fix-to-left' );
	}

}
