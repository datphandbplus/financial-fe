import {Component, Inject, Injector, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {FormBuilder} from '@angular/forms';
import {SnackBarService} from 'angular-core';
import _ from 'underscore';

import {FinanceBaseComponent} from '@finance/finance-base.component';
import {ProjectCostItemService} from '@finance/project/services/project-cost-item.service';
import {VendorCategoryService} from '@finance/vendor/services/vendor-category.service';
import {VendorService} from '@finance/vendor/services/vendor.service';
import {SheetService} from '@finance/project/services/sheet.service';
import {ProjectLineItemService} from '@finance/project/services/project-line-item.service';
import {ProjectCostModificationService} from '@finance/project/services/project-cost-modification.service';

import { MatTableDataSource } from '@angular/material';

@Component({
    selector	: 'dialog-project-purchase-order-detail',
    templateUrl	: '../templates/dialog-project-purchase-order-detail.pug',
})
export class DialogProjectPurchasingItemComponent extends FinanceBaseComponent implements OnInit, OnDestroy {

    public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>( [] );
    public displayedColumns: Array<string> = ['no','name','amount','unit','price','total','status'];
    public loaded: boolean;
    public isSubmitting: boolean;
    public projectID: number;
    public costItem: any = {};
    public element: any = {};
    /**
     * @constructor
     * @param {any} data
     * @param {MatDialogRef} dialogRef
     * @param {Injector} injector
     * @param {FormBuilder} fb
     * @param {SnackBarService} snackBarService
     * @param {ProjectCostItemService} projectCostItemService
     * @param {CostItemCategoryService} costItemCategoryService
     * @param {VendorCategoryService} vendorCategoryService
     * @param {VendorService} vendorService
     * @param {SheetService} projectSheetService
     * @param {ProjectLineItemService} projectLineItemService
     * @param {ProjectCostModificationService} projectCostModificationService
     */
    constructor(
        @Inject( MAT_DIALOG_DATA ) public data: any,
        public dialogRef						: MatDialogRef<DialogProjectPurchasingItemComponent>,
        public injector							: Injector,
        public fb								: FormBuilder,
        public snackBarService					: SnackBarService,
        public projectCostItemService			: ProjectCostItemService,
        public vendorCategoryService			: VendorCategoryService,
        public vendorService					: VendorService,
        public projectSheetService				: SheetService,
        public projectLineItemService			: ProjectLineItemService,
        public projectCostModificationService	: ProjectCostModificationService
    ) {
        super( injector );

    }

    /**
     * @constructor
     */
    public ngOnInit() {
        this.element = this.data.element;
        this.costItem = this.data.costItems;
        this.dataSource.data = this.data.element.project_cost_items;
    }

    /**
     * @constructor
     */
    public ngOnDestroy() {
        super.ngOnDestroy();
    }

    /**
     * Click No button event
     * @return {void}
     */
    public onNoClick() {
        this.dialogRef.close();
    }

}
