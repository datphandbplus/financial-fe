import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { ClientComponent } from './components/client.component';
import { DialogClientComponent } from './components/dialog-client.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { ClientService } from './services/client.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		ClientComponent, DialogClientComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogClientComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		ClientService,
		/* End Service Inject (Do not remove) */
	],
})
export class ClientModule {

	/**
	* @constructor
	*/
	constructor() {}

}
