import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { LightboxModule } from 'ngx-lightbox';

import { CoreModule } from '@core/core.module';
import { FinanceComponent } from './finance.component';
import { FinanceDirectionComponent } from './finance-direction.component';
import { routing, routingProviders } from './finance.routing';

/* Module Import (Do not remove) */
import { DashboardModule } from './dashboard/dashboard.module';
import { ClientModule } from './client/client.module';
import { VendorSettingModule } from './vendor/vendor-setting.module';
// import { LineItemSettingModule } from './line-item/line-item-setting.module';
// import { CostItemSettingModule } from './cost-item/cost-item-setting.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { SettingsModule } from './settings/settings.module';
/* End Module Import (Do not remove) */

@NgModule({
	imports: [
		CoreModule, routing,
		PerfectScrollbarModule, LightboxModule,

		/* Module Inject (Do not remove) */
		DashboardModule, ClientModule, VendorSettingModule,
		// LineItemSettingModule, CostItemSettingModule,
		ProjectModule, UserModule, SettingsModule,
		/* End Module Inject (Do not remove) */
	],
	exports		: [ FinanceComponent, FinanceDirectionComponent ],
	declarations: [ FinanceComponent, FinanceDirectionComponent ],
	providers	: [ routingProviders ],
})
export class FinanceModule {

	/**
	* @constructor
	*/
	constructor() {}

}
