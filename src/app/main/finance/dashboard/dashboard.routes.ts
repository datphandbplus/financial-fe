import { Routes } from '@angular/router';

import { DashboardComponent } from './components/dashboard.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';

export const dashboardRoutes: Routes = [
	{
		path		: 'dashboard',
		component	: DashboardComponent,
		canActivate	: [ AuthGrantService ],
		data: {
			title		: 'Dashboard',
			translate	: 'FINANCE.DIRECTION.DASHBOARD',
			roles: [
				'CEO', 'CFO', 'GENERAL_ACCOUNTANT',
				'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
				'PM', 'SALE',
				'QS', 'PURCHASING',
			],
		},
	},
];
