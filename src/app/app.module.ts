import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { ServiceWorkerModule, SwPush, SwUpdate } from '@angular/service-worker';

import { MediaService, ServiceWorkerService } from '@core';
import { AppComponent } from './app.component';
import { routing, routingProviders } from './app.routing';
import { ENVIRONMENT } from '@environments/environment';
import { AuthService } from './main/auth/services/auth.service';

/* Module Import (Do not remove) */
import { CoreModule } from '@core/core.module';
import { AccountModule } from '@main/account/account.module';
import { AuthModule } from '@main/auth/auth.module';
import { FinanceModule } from '@main/finance/finance.module';
/* End Module Import (Do not remove) */

@NgModule({
	imports: [
		routing,
		ServiceWorkerModule.register( 'ngsw-worker.js', { enabled: ENVIRONMENT.PRODUCTION } ),

		/* Module Import (Do not remove) */
		CoreModule, AuthModule,
		FinanceModule, AccountModule,
		/* End Module Import (Do not remove) */
	],
	declarations: [ AppComponent ],
	providers	: [ routingProviders ],
	bootstrap	: [ AppComponent ],
})
export class AppModule {

	/**
	* @constructor
	* @param {MediaService} mediaService
	* @param {Router} router
	* @param {SwPush} swPush
	* @param {SwUpdate} swUpdate
	* @param {AuthService} authService
	* @param {ServiceWorkerService} serviceWorkerService
	*/
	constructor(
		public mediaService			: MediaService,
		public router				: Router,
		public swPush				: SwPush,
		public swUpdate				: SwUpdate,
		public authService			: AuthService,
		public serviceWorkerService	: ServiceWorkerService
	) {
		// Set fixed view port in case screen with less than 1440
		this.mediaService.lt( 1440 ) && this.mediaService.setViewPort( 1440 );

		// Run service worker
		// this.runServiceWorker();
	}

	/**
	* Run service worker
	* @return {void}
	*/
	public runServiceWorker() {
		// Update available version
		this.serviceWorkerService.updateAvailableVersion();

		// In case service worker push notification is enabled
		if ( !this.swPush.isEnabled ) return;

		// Enable/Disable service worker push notification
		this.authService.isAuthorized()
			? this.serviceWorkerService.enablePushNotification()
			: this.serviceWorkerService.disablePushNotification();
	}

}
