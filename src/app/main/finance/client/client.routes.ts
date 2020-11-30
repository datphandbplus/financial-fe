import { Routes } from '@angular/router';

import { ClientComponent } from './components/client.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const clientRoutes: Routes = [
	{
		path		: 'client',
		component	: ClientComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'Client',
			translate	: 'FINANCE.DIRECTION.CLIENT',
			roles		: [ 'CEO', 'ADMIN', 'PROCUREMENT_MANAGER' ],
		},
	},
];
