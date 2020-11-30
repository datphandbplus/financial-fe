import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { FinanceComponent } from './finance.component';
import { dashboardRoutes } from './dashboard/dashboard.routes';
import { clientRoutes } from './client/client.routes';
import { vendorSettingRoutes } from './vendor/vendor-setting.routes';
// import { lineItemSettingRoutes } from './line-item/line-item-setting.routes';
// import { costItemSettingRoutes } from './cost-item/cost-item-setting.routes';
import { projectRoutes } from './project/project.routes';
import { userRoutes } from './user/user.routes';
import { settingsRoutes } from './settings/settings.routes';

const routes: Routes = [
	{ path: 'finance', redirectTo: 'finance/dashboard', pathMatch: 'full' },
	{
		path		: 'finance',
		component	: FinanceComponent,
		data		: {},
		children: [
			...dashboardRoutes,
			...clientRoutes,
			...vendorSettingRoutes,
			// ...lineItemSettingRoutes,
			// ...costItemSettingRoutes,
			...projectRoutes,
			...userRoutes,
			...settingsRoutes,
		],
	},
];

export const routingProviders: Array<any>[] = [];
export const routing: ModuleWithProviders = RouterModule.forChild( routes );
