import { Component } from '@angular/core';
import moment from 'moment-timezone';

import { ENVIRONMENT } from '@environments/environment';

@Component({
	selector	: 'copyright',
	templateUrl	: './copyright.pug',
	styleUrls	: [ './copyright.scss' ],
})
export class CopyrightComponent {

	public appName: string = ENVIRONMENT.APP_NAME;
	public appVersion: string = ENVIRONMENT.APP_VERSION;
	public currentYear: number = moment().year();

}
