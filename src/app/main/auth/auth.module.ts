import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';
import { routing, routingProviders } from './auth.routing';

/* Component Import (Do not remove) */
import { LoginComponent } from './components/login.component';
import { LogoutComponent } from './components/logout.component';
import { ActivateComponent } from './components/activate.component';
import { SyncTokenComponent } from './components/sync-token.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { AuthService } from './services/auth.service';
import { AuthGrantService } from './services/auth-grant.service';
import { AuthRoleService } from './services/auth-role.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, routing ],
	declarations: [
		/* Component Inject (Do not remove) */
		LoginComponent, LogoutComponent,
		ActivateComponent, SyncTokenComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		routingProviders,

		/* Service Inject (Do not remove) */
		AuthService, AuthGrantService,
		ActivateComponent, AuthRoleService,
		/* End Service Inject (Do not remove) */
	],
})
export class AuthModule {

	/**
	* @constructor
	*/
	constructor() {}

}
