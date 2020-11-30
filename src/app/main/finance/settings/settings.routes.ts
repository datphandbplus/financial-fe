import { Routes } from '@angular/router';

import { SettingsComponent } from './components/settings.component';
import { GeneralComponent } from './components/general.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const settingsRoutes: Routes = [
	{
		path		: 'settings',
		component	: SettingsComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Settings',
			translate	: 'FINANCE.DIRECTION.SETTINGS',
			roles		: [ 'CEO', 'ADMIN' ],
		},
		children: [
			{ path: '', redirectTo: 'general', pathMatch: 'full' },
			{
				path		: 'general',
				component	: GeneralComponent,
				data: {
					title		: 'General',
					translate	: 'FINANCE.DIRECTION.GENERAL',
				},
			},
		],
	},
];
