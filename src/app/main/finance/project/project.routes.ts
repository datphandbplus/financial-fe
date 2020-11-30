import { Routes } from '@angular/router';

import { ProjectComponent } from './components/project.component';
import { ProjectDetailComponent } from './components/project-detail.component';
import { ReceivablesComponent } from './components/receivables.component';
import { PayablesComponent } from './components/payables.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const projectRoutes: Routes = [
	{
		path: 'project',
		data: {
			title		: 'Quotation Management',
			translate	: 'FINANCE.DIRECTION.QUOTATION_MANAGEMENT',
			roles: [
				'CEO', 'CFO', 'GENERAL_ACCOUNTANT',
				'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER', 'CONSTRUCTION_MANAGER',
				'PM', 'SALE',
				'QS', 'PURCHASING',
			],
		},
		children: [
			{ path: '', redirectTo: 'list', pathMatch: 'full' },
			{
				path		: 'list',
				component	: ProjectComponent,
				canActivate	: [ AuthGrantService ],
				data: {
					title		: 'List',
					translate	: 'FINANCE.DIRECTION.LIST',
				},
			},
			{
				path		: 'detail/:id',
				component	: ProjectDetailComponent,
				canActivate	: [ AuthGrantService ],
				data: {
					title		: 'Detail',
					translate	: 'FINANCE.DIRECTION.DETAIL',
				},
			},
		],
	},
	{
		path		: 'receivables',
		component	: ReceivablesComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Receivables Management',
			translate	: 'FINANCE.DIRECTION.RECEIVABLES',
			roles: [
				'CEO', 'CFO', 'PM',
				'GENERAL_ACCOUNTANT', 'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER',
			],
		},
	},
	{
		path		: 'payables',
		component	: PayablesComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Payables Management',
			translate	: 'FINANCE.DIRECTION.PAYABLES',
			roles: [
				'CEO', 'CFO', 'PM',
				'GENERAL_ACCOUNTANT', 'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER',
				'CONSTRUCTION_MANAGER', 'CONSTRUCTION',
			],
		},
	},
];
