import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';
import { LezoModule } from '@ext/lezo/lezo.module';

/* Component Import (Do not remove) */
import { UserComponent } from './components/user.component';
import { DialogUserComponent } from './components/dialog-user.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { UserService } from './services/user.service';
import { UserRoleService } from './services/user-role.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, LezoModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		UserComponent, DialogUserComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogUserComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		UserService, UserRoleService,
		/* End Service Inject (Do not remove) */
	],
})
export class UserModule {

	/**
	* @constructor
	*/
	constructor() {}

}
