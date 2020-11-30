import { Routes } from '@angular/router';

import { UserComponent } from './components/user.component';
import { AuthGrantService } from '@auth/services/auth-grant.service';
import { AuthRoleService } from '@auth/services/auth-role.service';

export const userRoutes: Routes = [
	{
		path		: 'user',
		component	: UserComponent,
		canActivate	: [ AuthGrantService, AuthRoleService ],
		data: {
			title		: 'User',
			translate	: 'FINANCE.DIRECTION.USER',
			roles		: [ 'CEO', 'ADMIN' ],
		},
	},
];
