import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';
import { routing, routingProviders } from './account.routing';

/* Component Import (Do not remove) */
import { AccountSettingsComponent } from './components/account-settings.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { AccountService } from './services/account.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, routing ],
	declarations: [
		/* Component Inject (Do not remove) */
		AccountSettingsComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		routingProviders,

		/* Service Inject (Do not remove) */
		AccountService,
		/* End Service Inject (Do not remove) */
	],
})
export class AccountModule {

	/**
	* @constructor
	*/
	constructor() {}

}
