import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { ENVIRONMENT } from './environments/environment';

if ( ENVIRONMENT.production ) {
	enableProdMode();
} else {
	if ( ( <any> module ).hot ) ( <any> module ).hot.accept();
}

// Add favicon to <head>
const link: HTMLLinkElement = document.createElement( 'link' );
link.rel = 'icon';
link.type = 'image/x-icon';
link.href = ENVIRONMENT.APP_FAVICON;
document.head.appendChild( link );

// Add title to <head>
const title: HTMLElement = document.createElement( 'title' );
title.innerHTML = ENVIRONMENT.APP_TITLE;
document.head.appendChild( title );

platformBrowserDynamic().bootstrapModule( AppModule )
/* tslint:disable-next-line */
.catch( ( error: any ) => console.log( error ) );
