import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';

import { CoreModule } from '@core/core.module';

/* Component Import (Do not remove) */
import { ProjectComponent } from './components/project.component';
import { ProjectVOComponent } from './components/project-vo.component';
import { ProjectDetailComponent } from './components/project-detail.component';
import { ProjectQuotationComponent } from './components/project-quotation.component';
import { ProjectPurchasingComponent } from './components/project-purchasing.component';
import { ProjectCostComponent } from './components/project-cost.component';
import { ProjectReceivablesComponent } from './components/project-receivables.component';
import { ProjectPayablesComponent } from './components/project-payables.component';
import { ReceivablesComponent } from './components/receivables.component';
import { PayablesComponent } from './components/payables.component';
import { ProjectConfigComponent } from './components/project-config.component';
import { ProjectOverviewComponent } from './components/project-overview.component';
import { DialogCreateProjectComponent } from './components/dialog-create-project.component';
import { DialogProjectComponent } from './components/dialog-project.component';
import { DialogSheetComponent } from './components/dialog-sheet.component';
import { DialogVOComponent } from './components/dialog-vo.component';
import { DialogVOApproverComponent } from './components/dialog-vo-approver.component';
import { ProjectVOListComponent } from './components/project-vo-list.component';
import { ProjectVODetailComponent } from './components/project-vo-detail.component';
import { DialogVORemoveComponent } from './components/dialog-vo-remove.component';
import { DialogVORemoveCostComponent } from './components/dialog-vo-remove-cost.component';
import { DialogProjectPurchaseOrderComponent } from './components/dialog-project-purchase-order.component';
import { DialogProjectLineItemComponent } from './components/dialog-project-line-item.component';
import { DialogProjectCostItemComponent } from './components/dialog-project-cost-item.component';
import { DialogProjectCostItemModifyComponent } from './components/dialog-project-cost-item-modify.component';
import { DialogProjectBillComponent } from './components/dialog-project-bill.component';
import { DialogProjectBillPlanComponent } from './components/dialog-project-bill-plan.component';
import { DialogRequestPaymentComponent } from './components/dialog-request-payment.component';
import { DialogProjectPaymentComponent } from './components/dialog-project-payment.component';
import { DialogProjectBillInvoiceComponent } from './components/dialog-project-bill-invoice.component';
import { DialogProjectPaymentInvoiceComponent } from './components/dialog-project-payment-invoice.component';
import { DialogProjectPaymentOrderComponent } from './components/dialog-project-payment-order.component';
import { DialogProjectPaymentPlanComponent } from './components/dialog-project-payment-plan.component';
import { DialogProjectPaymentApproverComponent } from './components/dialog-project-payment-approver.component';
import { DialogModificationStatusComponent } from './components/dialog-modification-status.component';
import { DialogUploadFileComponent } from './components/dialog-upload-file.component';
import { DialogPurchaseOrderApproverComponent } from './components/dialog-purchase-order-approver.component';
import { DialogProjectPurchaseOrderModifyComponent } from './components/dialog-project-purchase-order-modify.component';
import { DialogProjectApproverComponent } from './components/dialog-project-approver.component';
import { DialogPlanApproverComponent } from './components/dialog-plan-approver.component';
import { DialogProjectQuotationDiscountComponent } from './components/dialog-project-quotation-discount.component';
/* End Component Import (Do not remove) */

/* Service Import (Do not remove) */
import { ProjectService } from './services/project.service';
import { ProjectBillService } from './services/project-bill.service';
import { ProjectBillPlanService } from './services/project-bill-plan.service';
import { SheetService } from './services/sheet.service';
import { VOService } from './services/vo.service';
import { ProjectPurchaseOrderService } from './services/project-purchase-order.service';
import { ReceivableService } from './services/receivable.service';
import { ProjectLineItemService } from './services/project-line-item.service';
import { ProjectCostItemService } from './services/project-cost-item.service';
import { ProjectPaymentService } from './services/project-payment.service';
import { ProjectPaymentPlanService } from './services/project-payment-plan.service';
import { PayableService } from './services/payable.service';
import { ProjectCostModificationService } from './services/project-cost-modification.service';
import { ProjectPaymentApproverService } from './services/project-payment-approver.service';
import { PurchaseOrderApproverService } from './services/purchase-order-approver.service';
import {DialogProjectPurchasingItemComponent} from "@finance/project/components/dialog-project-purchasing-item.component";
import {LineItemCategoryService} from "@finance/line-item/services/line-item-category.service";
import {CostItemCategoryService} from "@finance/cost-item/services/cost-item-category.service";
/* End Service Import (Do not remove) */

@NgModule({
	imports: [ CoreModule, ChartsModule ],
	declarations: [
		/* Component Inject (Do not remove) */
		ProjectComponent, DialogCreateProjectComponent, DialogProjectComponent,
		ProjectDetailComponent, ReceivablesComponent, PayablesComponent,
		DialogSheetComponent, DialogProjectLineItemComponent, DialogProjectCostItemComponent,
		ProjectReceivablesComponent, DialogProjectBillComponent, ProjectCostComponent,
		DialogRequestPaymentComponent, ProjectPayablesComponent, DialogProjectPaymentComponent,
		ProjectQuotationComponent, DialogProjectBillInvoiceComponent,
		ProjectConfigComponent, ProjectPurchasingComponent, ProjectOverviewComponent,
		DialogProjectPaymentInvoiceComponent, DialogProjectPaymentOrderComponent,
		DialogUploadFileComponent, DialogModificationStatusComponent, DialogProjectPurchaseOrderComponent,
		DialogProjectPaymentApproverComponent, DialogPurchaseOrderApproverComponent, DialogProjectApproverComponent,
		DialogProjectPaymentPlanComponent, DialogProjectBillPlanComponent, DialogPlanApproverComponent,
		DialogProjectPurchaseOrderModifyComponent, DialogProjectCostItemModifyComponent, DialogProjectQuotationDiscountComponent,
		ProjectVOComponent, DialogVOComponent, DialogVORemoveComponent, DialogVORemoveCostComponent,
		ProjectVOListComponent, ProjectVODetailComponent, DialogVOApproverComponent,DialogProjectPurchasingItemComponent,
		/* End Component Inject (Do not remove) */
	],
	entryComponents: [
		/* Component Inject (Do not remove) */
		DialogCreateProjectComponent, DialogProjectComponent, DialogSheetComponent,
		DialogProjectLineItemComponent, DialogProjectCostItemComponent, DialogProjectBillComponent,
		DialogRequestPaymentComponent, DialogProjectPaymentComponent,
		DialogProjectBillInvoiceComponent, DialogProjectPaymentInvoiceComponent,
		DialogProjectPaymentOrderComponent, DialogModificationStatusComponent, DialogUploadFileComponent,
		DialogProjectPurchaseOrderComponent, DialogProjectPaymentApproverComponent,
		DialogPurchaseOrderApproverComponent, DialogProjectApproverComponent, DialogProjectPaymentPlanComponent,
		DialogProjectBillPlanComponent, DialogPlanApproverComponent, DialogProjectPurchaseOrderModifyComponent,
		DialogProjectCostItemModifyComponent, DialogProjectQuotationDiscountComponent, DialogVOComponent,
		DialogVORemoveComponent, DialogVORemoveCostComponent, DialogVOApproverComponent,DialogProjectPurchasingItemComponent
		/* End Component Inject (Do not remove) */
	],
	providers: [
		/* Service Inject (Do not remove) */
		ProjectService, SheetService, ReceivableService,
		ProjectLineItemService, ProjectCostItemService, PayableService,
		ProjectBillService, ProjectPaymentService, ProjectCostModificationService,
		ProjectPurchaseOrderService, ProjectPaymentApproverService, PurchaseOrderApproverService,
		ProjectPaymentPlanService, ProjectBillPlanService, VOService,LineItemCategoryService,CostItemCategoryService
		/* End Service Inject (Do not remove) */
	],
})
export class ProjectModule {

	/**
	* @constructor
	*/
	constructor() {}

}
