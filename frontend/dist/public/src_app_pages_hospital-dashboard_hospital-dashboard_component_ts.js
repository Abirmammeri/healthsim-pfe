"use strict";
(self["webpackChunkhealthsim"] = self["webpackChunkhealthsim"] || []).push([["src_app_pages_hospital-dashboard_hospital-dashboard_component_ts"],{

/***/ 9943:
/*!**************************************************************************!*\
  !*** ./src/app/pages/hospital-dashboard/hospital-dashboard.component.ts ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HospitalDashboardComponent: () => (/* binding */ HospitalDashboardComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ 5072);
/* harmony import */ var lucide_angular__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! lucide-angular */ 4284);
/* harmony import */ var _shared_api_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/api.service */ 2571);








const _c0 = a0 => ["/hospitals", a0, "services"];
function HospitalDashboardComponent_span_13_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "span", 15);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const h_r1 = ctx.ngIf;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstyleProp"]("background-color", ctx_r1.statusColor(h_r1.loadStatus) + "15")("color", ctx_r1.statusColor(h_r1.loadStatus));
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", ctx_r1.statusLabel(h_r1.loadStatus), " ");
  }
}
function HospitalDashboardComponent_div_18_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 16)(1, "div", 17);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "Chargement\u2026");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
}
function HospitalDashboardComponent_div_19_div_51_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 49);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](1, "Aucun service.");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
}
function HospitalDashboardComponent_div_19_div_53_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 50)(1, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](2, "div", 51);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "div")(4, "div", 52);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](8, "div", 53)(9, "div", 54);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](10);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](11, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](12, "lits");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const s_r3 = ctx.$implicit;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstyleProp"]("background-color", ctx_r1.statusColor(s_r3.status));
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](s_r3.name);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate3"]("", s_r3.doctors, " m\u00E9d. \u00B7 ", s_r3.nurses, " inf. \u00B7 ", s_r3.patients, " patients");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", s_r3.availableBeds, "/", s_r3.beds, "");
  }
}
function HospitalDashboardComponent_div_19_div_77_div_5_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 57);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](1, "lucide-icon", 58);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "div", 59)(3, "div", 60);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](5, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
  }
  if (rf & 2) {
    const a_r4 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstyleProp"]("background-color", (a_r4.severity === "critical" ? "#E53935" : "#FB8C00") + "10");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstyleProp"]("color", a_r4.severity === "critical" ? "#E53935" : "#FB8C00");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", a_r4.serviceName, " \u2014 ", a_r4.type, "");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](a_r4.description);
  }
}
function HospitalDashboardComponent_div_19_div_77_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 20)(1, "h2", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](2, "lucide-icon", 55);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3, " Alertes r\u00E9centes ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](4, "div", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](5, HospitalDashboardComponent_div_19_div_77_div_5_Template, 7, 7, "div", 56);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
  }
  if (rf & 2) {
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx_r1.alerts());
  }
}
function HospitalDashboardComponent_div_19_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 18)(1, "div", 19)(2, "div", 20)(3, "div", 21)(4, "div", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](5, "lucide-icon", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "div")(7, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](9, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](10, "Personnel");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](11, "div", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](12);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](13, "div", 20)(14, "div", 21)(15, "div", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](16, "lucide-icon", 28);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](17, "div")(18, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](19);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](20, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](21, "Lits disponibles");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](22, "div", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](24, "div", 20)(25, "div", 21)(26, "div", 29);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](27, "lucide-icon", 30);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](28, "div")(29, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](30);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](31, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](32, "Patients actifs");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](33, "div", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](34);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](35, "div", 20)(36, "div", 21)(37, "div", 31);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](38, "lucide-icon", 32);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](39, "div")(40, "div", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](41);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](42, "div", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](43, "Alertes actives");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](44, "div", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](45);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](46, "div", 33)(47, "div", 34)(48, "h2", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](49, "lucide-icon", 36);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](50, " Services ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](51, HospitalDashboardComponent_div_19_div_51_Template, 2, 0, "div", 37);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](52, "div", 38);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](53, HospitalDashboardComponent_div_19_div_53_Template, 13, 8, "div", 39);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](54, "div", 20)(55, "h2", 35);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](56, "lucide-icon", 40);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](57, " \u00C9tat des \u00E9quipements ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](58, "div", 41)(59, "div", 42)(60, "div", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](61, "div", 44);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](62, " Op\u00E9rationnels ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](63, "div", 45);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](64);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](65, "div", 42)(66, "div", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](67, "div", 46);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](68, " Maintenance ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](69, "div", 45);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](70);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](71, "div", 42)(72, "div", 43);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](73, "div", 47);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](74, " Hors service ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](75, "div", 45);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](76);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()()()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](77, HospitalDashboardComponent_div_19_div_77_Template, 6, 1, "div", 48);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const d_r5 = ctx.ngIf;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](8);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.doctors + d_r5.nurses);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", d_r5.doctors, " m\u00E9decins \u00B7 ", d_r5.nurses, " infirmiers");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate2"]("", d_r5.availableBeds, "/", d_r5.totalBeds, "");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", d_r5.occupiedBeds, " occup\u00E9s");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](7);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.patients);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("Charge : ", d_r5.loadPercentage, "%");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](d_r5.activeAlerts > 0 ? "bg-red-50" : "bg-gray-50");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](d_r5.activeAlerts > 0 ? "text-red-600" : "text-gray-400");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.activeAlerts);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("", d_r5.serviceCount, " services");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r1.services().length === 0);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx_r1.services());
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](11);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.equipmentStatus.operational);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.equipmentStatus.maintenance);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](d_r5.equipmentStatus.offline);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r1.alerts().length > 0);
  }
}
class HospitalDashboardComponent {
  constructor() {
    this.api = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_shared_api_service__WEBPACK_IMPORTED_MODULE_0__.ApiService);
    this.route = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_angular_router__WEBPACK_IMPORTED_MODULE_2__.ActivatedRoute);
    this.router = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_angular_router__WEBPACK_IMPORTED_MODULE_2__.Router);
    this.hospitalId = 0;
    this.hospital = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)(null);
    this.dashboard = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)(null);
    this.services = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)([]);
    this.alerts = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)([]);
    this.loading = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)(true);
  }
  ngOnInit() {
    this.hospitalId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
    this.api.getHospital(this.hospitalId).subscribe({
      next: h => this.hospital.set(h),
      error: () => {}
    });
    this.api.getHospitalDashboard(this.hospitalId).subscribe({
      next: d => {
        this.dashboard.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.api.listServices(this.hospitalId).subscribe({
      next: s => this.services.set(s),
      error: () => {}
    });
    this.api.getHospitalAlerts(this.hospitalId).subscribe({
      next: a => this.alerts.set(a),
      error: () => {}
    });
  }
  back() {
    this.router.navigate(['/']);
  }
  statusColor(s) {
    if (s === 'critical') return '#E53935';
    if (s === 'high' || s === 'medium') return '#FB8C00';
    return '#43A047';
  }
  statusLabel(s) {
    if (s === 'critical') return 'CRITIQUE';
    if (s === 'high') return 'CHARGE ÉLEVÉE';
    if (s === 'medium') return 'MOYENNE';
    return 'NORMALE';
  }
  static {
    this.ɵfac = function HospitalDashboardComponent_Factory(t) {
      return new (t || HospitalDashboardComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: HospitalDashboardComponent,
      selectors: [["app-hospital-dashboard"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 20,
      vars: 8,
      consts: [[1, "flex", "flex-col", "h-full"], [1, "px-8", "py-6", "bg-card", "border-b"], [1, "flex", "items-center", "gap-2", "mb-1"], ["data-testid", "btn-back-to-map", 1, "flex", "items-center", "gap-1.5", "text-muted-foreground", "hover:text-foreground", "text-sm", "transition-colors", 3, "click"], ["name", "arrow-left", 1, "w-4", "h-4"], [1, "flex", "items-center", "justify-between", "flex-wrap", "gap-3"], [1, "text-2xl", "font-bold", "text-foreground", "font-display"], [1, "text-sm", "text-muted-foreground", "mt-0.5"], [1, "flex", "items-center", "gap-2"], ["class", "text-xs font-bold px-3 py-1.5 rounded-full uppercase", 3, "backgroundColor", "color", 4, "ngIf"], ["data-testid", "btn-view-services", 1, "px-4", "py-2", "rounded-lg", "text-sm", "font-medium", "border", "border-border", "bg-card", "hover:bg-muted", "text-foreground", "transition-colors", "flex", "items-center", "gap-2", 3, "routerLink"], ["name", "eye", 1, "w-4", "h-4"], [1, "flex-1", "overflow-y-auto", "p-8"], ["class", "flex items-center justify-center h-40", 4, "ngIf"], ["class", "space-y-6", 4, "ngIf"], [1, "text-xs", "font-bold", "px-3", "py-1.5", "rounded-full", "uppercase"], [1, "flex", "items-center", "justify-center", "h-40"], [1, "text-muted-foreground"], [1, "space-y-6"], [1, "grid", "grid-cols-2", "lg:grid-cols-4", "gap-4"], [1, "bg-card", "rounded-2xl", "border", "border-border", "shadow-sm", "p-5"], [1, "flex", "items-center", "gap-3"], [1, "w-10", "h-10", "rounded-lg", "flex", "items-center", "justify-center", 2, "background", "rgba(0,188,212,0.1)"], ["name", "users", 1, "w-5", "h-5", 2, "color", "#00BCD4"], [1, "text-2xl", "font-bold", "text-foreground"], [1, "text-xs", "text-muted-foreground"], [1, "text-xs", "text-muted-foreground", "mt-3"], [1, "w-10", "h-10", "rounded-lg", "flex", "items-center", "justify-center", "bg-green-50"], ["name", "bed", 1, "w-5", "h-5", "text-green-600"], [1, "w-10", "h-10", "rounded-lg", "flex", "items-center", "justify-center", "bg-blue-50"], ["name", "trending-up", 1, "w-5", "h-5", "text-blue-600"], [1, "w-10", "h-10", "rounded-lg", "flex", "items-center", "justify-center"], ["name", "alert-triangle", 1, "w-5", "h-5"], [1, "grid", "grid-cols-1", "lg:grid-cols-3", "gap-4"], [1, "lg:col-span-2", "bg-card", "rounded-2xl", "border", "border-border", "shadow-sm", "p-5"], [1, "font-bold", "text-foreground", "flex", "items-center", "gap-2", "mb-4"], ["name", "stethoscope", 1, "w-4", "h-4", 2, "color", "#00BCD4"], ["class", "text-sm text-muted-foreground text-center py-6", 4, "ngIf"], [1, "space-y-2"], ["class", "flex items-center justify-between p-3 rounded-lg bg-muted/30", 4, "ngFor", "ngForOf"], ["name", "package", 1, "w-4", "h-4", 2, "color", "#00BCD4"], [1, "space-y-3"], [1, "flex", "items-center", "justify-between"], [1, "flex", "items-center", "gap-2", "text-sm"], [1, "w-2", "h-2", "rounded-full", "bg-green-500"], [1, "font-bold", "text-foreground"], [1, "w-2", "h-2", "rounded-full", "bg-orange-500"], [1, "w-2", "h-2", "rounded-full", "bg-red-500"], ["class", "bg-card rounded-2xl border border-border shadow-sm p-5", 4, "ngIf"], [1, "text-sm", "text-muted-foreground", "text-center", "py-6"], [1, "flex", "items-center", "justify-between", "p-3", "rounded-lg", "bg-muted/30"], [1, "w-2", "h-2", "rounded-full"], [1, "font-semibold", "text-foreground", "text-sm"], [1, "text-right"], [1, "text-sm", "font-bold", "text-foreground"], ["name", "alert-triangle", 1, "w-4", "h-4", "text-orange-500"], ["class", "flex items-start gap-3 p-3 rounded-lg", 3, "backgroundColor", 4, "ngFor", "ngForOf"], [1, "flex", "items-start", "gap-3", "p-3", "rounded-lg"], ["name", "alert-circle", 1, "w-4", "h-4", "mt-0.5", "flex-shrink-0"], [1, "flex-1", "min-w-0"], [1, "text-sm", "font-semibold", "text-foreground"]],
      template: function HospitalDashboardComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "button", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function HospitalDashboardComponent_Template_button_click_3_listener() {
            return ctx.back();
          });
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](4, "lucide-icon", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](5, " Retour \u00E0 la carte ");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](6, "div", 5)(7, "div")(8, "h1", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](10, "div", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](11);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](12, "div", 8);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](13, HospitalDashboardComponent_span_13_Template, 2, 5, "span", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](14, "a", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](15, "lucide-icon", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](16, " Voir les services ");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](17, "div", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](18, HospitalDashboardComponent_div_18_Template, 3, 0, "div", 13)(19, HospitalDashboardComponent_div_19_Template, 78, 20, "div", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
        }
        if (rf & 2) {
          let tmp_0_0;
          let tmp_1_0;
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](9);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"]((tmp_0_0 = ctx.hospital()) == null ? null : tmp_0_0.name);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"]((tmp_1_0 = ctx.hospital()) == null ? null : tmp_1_0.address);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.hospital());
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("routerLink", _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵpureFunction1"](6, _c0, ctx.hospitalId));
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.loading());
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", !ctx.loading() && ctx.dashboard());
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_3__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_3__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_3__.NgIf, _angular_router__WEBPACK_IMPORTED_MODULE_2__.RouterLink, lucide_angular__WEBPACK_IMPORTED_MODULE_4__.LucideAngularModule, lucide_angular__WEBPACK_IMPORTED_MODULE_4__.LucideAngularComponent],
      encapsulation: 2
    });
  }
}

/***/ })

}]);
//# sourceMappingURL=src_app_pages_hospital-dashboard_hospital-dashboard_component_ts.js.map