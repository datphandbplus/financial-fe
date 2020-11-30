import { NgModule } from '@angular/core';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { VendorSettingComponent } from './components/vendor-setting.component';
import { VendorCategoryComponent } from './components/vendor-category.component';
import { VendorComponent } from './components/vendor.component';
import { DialogVendorCategoryComponent } from './components/dialog-vendor-category.component';
import { DialogVendorComponent } from './components/dialog-vendor.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { VendorCategoryService } from './services/vendor-category.service';
import { VendorService } from './services/vendor.service';
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		VendorSettingComponent, VendorCategoryComponent, VendorComponent,
		DialogVendorCategoryComponent, DialogVendorComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogVendorCategoryComponent, DialogVendorComponent,
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		VendorCategoryService, VendorService,
		/* End Service Inject (Do not remove) */
	],
})
export class VendorSettingModule {

	/**
	* @constructor
	*/
	constructor() {}

}
