import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import {
	CoreModule as AngularCoreModule,
	ErrorModule, MultiTranslateHttpLoader, CustomMissingTranslationHandler,
	DEFAULT_EXPIRE_DAYS, DEFAULT_STORAGE_HASH_KEY, DEFAULT_AUTHORIZED_KEY,
	DEFAULT_FCM_PUBLIC_KEY, DEFAULT_SERVER_API_URL, DEFAULT_SERVER_WEBSOCKET_URL,
	DEFAULT_APP_NAME, DEFAULT_APP_LOGO, DEFAULT_APP_URL,
	DEFAULT_TIMEZONE, DEFAULT_LOCALE
} from 'angular-core';
import { Ng5SliderModule } from 'ng5-slider';
import _ from 'underscore';

import { ENVIRONMENT } from '@environments/environment';
import { HASH } from '@environments/hash';
import { CONSTANTS } from '@resources';

/* Component Inject (Do not remove) */
import { CopyrightComponent } from './components/copyright/copyright.component';
import { UploadBoxComponent } from './components/upload-box/upload-box.component';
/* End Component Inject (Do not remove) */

/* Directive Inject (Do not remove) */
import { FooterRowInTopDirective } from './directives/footer-row-in-top.directive';
/* End Directive Inject (Do not remove) */

export function translateLoader( http: HttpClient ) {
	return new MultiTranslateHttpLoader(
		http,
		[
			{ prefix: 'assets/i18n/', suffix: '.json' },
			{ prefix: 'assets/i18n/finance/', suffix: '.json' },
		]
	);
}

_.mixin({
	get: ( obj: any, key: any ) => {
		const type: string = typeof key;

		if ( type === 'string' || type === 'number' ) {
			key = ( '' + key ).replace( /\[(.*?)\]/, ( _m: any, _key: any ) => {
				return '.' + _key.replace( /["']/g, '' );
			} ).split( '.' );
		}

		/* tslint:disable-next-line */
		for ( let i: number = 0, l: number = key.length; i < l; i++ ) {
			if ( typeof obj !== 'undefined' && _.has( obj, key[ i ] ) ) {
				obj = obj[ key[ i ] ];
			} else {
				return undefined;
			}
		}

		return obj;
	},
});

@NgModule({
	imports: [
		ErrorModule, Ng5SliderModule,
		AngularCoreModule.forRoot({ locale: CONSTANTS.LOCALE }),
		TranslateModule.forChild({
			missingTranslationHandler: {
				provide	: MissingTranslationHandler,
				useClass: CustomMissingTranslationHandler,
			},
			loader: {
				provide		: TranslateLoader,
				useFactory	: translateLoader,
				deps		: [ HttpClient ],
			},
		}),
	],
	declarations: [
		/* Component Inject (Do not remove) */
		CopyrightComponent, UploadBoxComponent,
		/* End Component Inject (Do not remove) */

		/* Directive Inject (Do not remove) */
		FooterRowInTopDirective,
		/* End Directive Inject (Do not remove) */
	],
	exports: [
		AngularCoreModule,

		/* Component Inject (Do not remove) */
		CopyrightComponent, UploadBoxComponent,
		/* End Component Inject (Do not remove) */

		/* Directive Inject (Do not remove) */
		FooterRowInTopDirective,
		/* End Directive Inject (Do not remove) */
	],
	providers: [
		{ provide: DEFAULT_EXPIRE_DAYS, useValue: HASH.EXPIRE_DAYS },
		{ provide: DEFAULT_STORAGE_HASH_KEY, useValue: HASH.STORAGE_HASH_KEY },
		{ provide: DEFAULT_AUTHORIZED_KEY, useValue: HASH.AUTHORIZED_KEY },
		{ provide: DEFAULT_FCM_PUBLIC_KEY, useValue: ENVIRONMENT.FCM_PUBLIC_KEY },
		{ provide: DEFAULT_SERVER_API_URL, useValue: ENVIRONMENT.SERVER_API_URL },
		{ provide: DEFAULT_SERVER_WEBSOCKET_URL, useValue: ENVIRONMENT.SERVER_WEBSOCKET_URL },
		{ provide: DEFAULT_APP_NAME, useValue: ENVIRONMENT.APP_NAME },
		{ provide: DEFAULT_APP_LOGO, useValue: ENVIRONMENT.APP_LOGO_BLUE },
		{ provide: DEFAULT_APP_URL, useValue: ENVIRONMENT.APP_URL },
		{ provide: DEFAULT_TIMEZONE, useValue: CONSTANTS.TIMEZONE },
		{ provide: DEFAULT_LOCALE, useValue: CONSTANTS.LOCALE },
	],
})
export class CoreModule {}
