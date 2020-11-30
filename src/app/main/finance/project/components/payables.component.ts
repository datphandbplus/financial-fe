import {
    Component, OnInit,
    Injector, OnDestroy, ViewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import _ from 'underscore';
import moment from 'moment-timezone';

import {ProjectBaseComponent} from '@finance/project/project-base.component';
import {Direction} from '@finance/finance-direction.component';
import {PayableService} from '@finance/project/services/payable.service';
import {NumberService} from '@core';

import {PAYMENT_APPROVE_STATUS} from '@resources';
import {MatSort} from "@angular/material/sort";
import {TableUtil} from "@app/utils/tableUtils";
import {SnackBarService} from "angular-core";
import {ExcelService} from "@ext/lezo/services/excel.service";

@Component({
    selector: 'payables',
    templateUrl: '../templates/payables.pug',
    styleUrls: ['../styles/payables.scss'],
})
@Direction({
    path: 'payables',
    data: {title: 'FINANCE.DIRECTION.PAYABLES', icon: 'icon icon-spend'},
    priority: 70,
    roles: [
        'CEO', 'CFO', 'PM',
        'GENERAL_ACCOUNTANT', 'LIABILITIES_ACCOUNTANT', 'PROCUREMENT_MANAGER',
        'CONSTRUCTION_MANAGER', 'CONSTRUCTION',
    ],
})
export class PayablesComponent extends ProjectBaseComponent implements OnInit, OnDestroy {
    @ViewChild(MatSort) sort: MatSort;

    public sortKey: string = 'project.name';
    public displayedColumns: Array<string> = [
        'po', 'project', 'vendor',
        'aic', 'amount', 'invoice_date',
        'pay_date', 'status',
    ];
    public payables: Array<any> = [];
    public currentDate: any = moment();
    public filteredPO: Array<any> = [];
    public filters: any = {
        invoice_date: {
            begin: this.currentDate.clone().startOf('Y'),
            end: this.currentDate.clone().endOf('Y'),
        },
        pay_date: {
            begin: this.currentDate.clone().startOf('Y'),
            end: this.currentDate.clone().endOf('Y'),
        },
    };
    public footerRow: any = {total: 0};
    public queryOptions: any = {
        invoice_date_begin: moment().clone().subtract(1, 'year').startOf('year'),
        invoice_date_end: moment().clone().endOf('day'),
        pay_date_begin: moment().clone().subtract(1, 'year').startOf('year'),
        pay_date_end: moment().clone().endOf('day'),
    };

    /**
     * @constructor
     * @param {Injector} injector
     * @param {PayableService} payableService
     * @param {TranslateService} translateService
     */
    constructor(
        public injector: Injector,
        public payableService: PayableService,
        public excelService: ExcelService,
		public snackBarService	: SnackBarService,
        public translateService: TranslateService
    ) {
        super(injector);

        if (this.isPM) {
            this.displayedColumns.splice(2, 1); // Remove AIC Column
        }
    }

    /**
     * @constructor
     */
    public ngOnInit() {
        this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
            const value: any = data[sortHeaderId];
            return typeof value === "string" ? value.toLowerCase() : value;
        };
        this.initData();
    }

    /**
     * @constructor
     */
    public ngOnDestroy() {
        super.ngOnDestroy();
    }

    /**
     * Init all data
     * @return {void}
     */
    public initData() {
        this.getList();
    }

    /**
     * Get payables
     * @return {void}
     */
    public getList() {
        this.setProcessing(true);
        this.loaded = false;

        this.payableService
            .getAll(this.queryOptions.invoice_date_begin, this.queryOptions.invoice_date_end)
            .subscribe((result: any) => {
                this.setProcessing(false);

                const projectIds: Array<number> = [];
                const vendorIds: Array<number> = [];
                const aicIds: Array<number> = [];
                const statusIds: Array<number> = [];
                const poName: Array<string> = [];
                const _filteredPO: Array<any> = [];

                result = _.map(result, (item: any) => {
                    this.getPayDateAndCountDay(item);

                    item.vendor = item.project_payment_details
                    && item.project_payment_details[0]
                    && item.project_payment_details[0].project_cost_item
                        ? item.project_payment_details[0].project_cost_item.vendor
                        : null;

                    item.is_procurement_approved = !!_.findWhere(
                        item.project_payment_approvers,
                        {role_key: 'PROCUREMENT_MANAGER', status: PAYMENT_APPROVE_STATUS.APPROVED}
                    );

                    item.total = item.is_procurement_approved
                        ? item.total_real + item.total_vat_real
                        : item.total + item.total_vat;

                    // Set filters
                    if (item.project) {
                        item.project.id && projectIds.push(item.project.id);
                        item.project.user && item.project.user.id && aicIds.push(item.project.user.id);
                    }

                    item.project_purchase_order
                    && item.project_purchase_order.vendor
                    && item.project_purchase_order.vendor.id
                    && vendorIds.push(item.project_purchase_order.vendor.id);

                    item.po_name = item.project_purchase_order && item.project_purchase_order.id
                        ? 'PO' + NumberService.padNumberFormatter(item.project_purchase_order.id, 4)
                        : null;

                    if (item.po_name && !_filteredPO[item.po_name]) {
                        _filteredPO[item.po_name] = {id: item.po_name, po_name: item.po_name};
                        poName.push(item.po_name);
                    }

                    item.status_name && item.status_name.id >= 0 && statusIds.push(item.status_name.id);
                    item.manager_name = item.project.user.full_name || '';

                    return item;
                });

                this.loaded = true;
                this.filters['project.id'] = _.uniq(projectIds);
                this.filters['project_purchase_order.vendor.id'] = _.uniq(vendorIds);
                this.filters['project.user.id'] = _.uniq(aicIds);
                this.filters['status_name.id'] = _.uniq(statusIds);
                this.filters.po_name = _.uniq(poName);
                this.filteredPO = _.values(_filteredPO);
                this.payables = result;
                this.dataSource.sort = this.sort;
                this.dataSource.data = this.customSortDataSource(result);
                this.dataSourceClone = result;
                this.customFilter();
            });
    }

    /**
     * Handle project change event
     * @return {void}
     */
    public onProjectChange() {
        const clientIds: Array<number> = [];
        const aicIds: Array<number> = [];
        const statusIds: Array<number> = [];

        _.map(this.payables, (item: any) => {
            if (!item.project || !_.contains(this.filters['project.id'], item.project_id)) return;

            item.project.client && item.project.client.id && clientIds.push(item.project.client.id);
            item.project.user && item.project.user.id && aicIds.push(item.project.user.id);

            item.status_name && item.status_name.id >= 0 && statusIds.push(item.status_name.id);
        });

        this.filters['project.client.id'] = _.uniq(clientIds);
        this.filters['project.user.id'] = _.uniq(aicIds);
        this.filters['status_name.id'] = _.uniq(statusIds);
    }

    /**
     * Reset filter
     * @return {void}
     */
    public resetFilter() {
        this.filters = {
            invoice_date: {
                begin: this.currentDate.clone().startOf('Y'),
                end: this.currentDate.clone().endOf('Y'),
            },
            pay_date: {
                begin: this.currentDate.clone().startOf('Y'),
                end: this.currentDate.clone().endOf('Y'),
            },
        };
    }

    /**
     * Custom filter
     * @return {void}
     */
    public customFilter() {
        this.applyFilter();
        let amount: number = 0;

        _.each(this.dataSource.filteredData, (item: any) => {
            amount += item.is_procurement_approved
                ? item.total_real + item.total_vat_real
                : item.total + item.total_vat;
        });

        this.footerRow.total = amount;
    }

    /**
     * Custom filter
     * @return {void}
     */
    public quotationRangeChange(event: any) {
        if (!event || !event.value) return;
        this.getList();
    }

	public exportExcel() {
		const headerSetting = {
            header: ['PO Name', 'Project', 'Vendor', 'Project Manager', 'Amount', 'Invoice Date', 'Pay Date', 'Status'],
            noData: this.translateService.instant('FINANCE.SETTINGS.MESSAGES.NO_RECORD_DATA_NAME', {name: 'payment'}),
            fgColor: 'ffffff',
            bgColor: '00245A'
        };
        const title = 'Payments List';
        const sheetName = 'Payments';
        const fileName = 'Payments_List';
        const exportData: any[] = [];
        this.dataSource.data.forEach((item: any) => {
            const dataItem: any[] = [];
            const invoice_date = item.invoice_date ? TableUtil.getDateFormatForExcel(new Date(item.invoice_date)) : '';
            const pay_date = item.pay_date ? TableUtil.getDateFormatForExcel(new Date(item.pay_date)) : '';
            const status = (item.status_name && item.status_name.name) ? {value: this.translateService.instant(item.status_name.name), fgColor: item.status_name.color ? item.status_name.color.replace('#', '') : 'FF0000'} : {value: '', fgColor: 'FF0000'};
            dataItem.push(item.po_name || 'N/A');
            dataItem.push(item.name || 'N/A');
            dataItem.push(item.vendor_name || 'N/A');
            dataItem.push(item.manager_name || 'N/A');
            dataItem.push(TableUtil.getNumberFormatForExcel(item.total) || '');
            dataItem.push(invoice_date);
            dataItem.push(pay_date);
            dataItem.push(status);
            exportData.push(dataItem);
        });
        const extraData = [{title: 'Total', value: TableUtil.getNumberFormatForExcel(this.footerRow.total), fgColors: ['38AE00', 'FD8631']}];
        this.excelService.exportArrayToExcel(
            exportData,
            title,
            headerSetting,
            sheetName,
            fileName,
            extraData
        );
	}

}
