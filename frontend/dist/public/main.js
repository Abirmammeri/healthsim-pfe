"use strict";
(self["webpackChunkhealthsim"] = self["webpackChunkhealthsim"] || []).push([["main"],{

/***/ 92:
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AppComponent: () => (/* binding */ AppComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/router */ 5072);
/* harmony import */ var _shared_layout_sidebar_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shared/layout/sidebar.component */ 2056);
/* harmony import */ var _shared_toast_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shared/toast.service */ 1556);







function AppComponent_div_5_div_3_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](0, "div", 7);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtext"](1);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵnextContext"]().$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtextInterpolate"](t_r2.description);
  }
}
function AppComponent_div_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵgetCurrentView"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](0, "div", 4);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵlistener"]("click", function AppComponent_div_5_Template_div_click_0_listener() {
      const t_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵrestoreView"](_r1).$implicit;
      const ctx_r2 = _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵnextContext"]();
      return _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵresetView"](ctx_r2.toasts.dismiss(t_r2.id));
    });
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](1, "div", 5);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtext"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtemplate"](3, AppComponent_div_5_div_3_Template, 2, 1, "div", 6);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const t_r2 = ctx.$implicit;
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵclassProp"]("error", t_r2.variant === "destructive")("success", t_r2.variant === "success");
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtextInterpolate"](t_r2.title);
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵproperty"]("ngIf", t_r2.description);
  }
}
class AppComponent {
  constructor() {
    this.toasts = (0,_angular_core__WEBPACK_IMPORTED_MODULE_2__.inject)(_shared_toast_service__WEBPACK_IMPORTED_MODULE_1__.ToastService);
  }
  static {
    this.ɵfac = function AppComponent_Factory(t) {
      return new (t || AppComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵdefineComponent"]({
      type: AppComponent,
      selectors: [["app-root"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵStandaloneFeature"]],
      decls: 6,
      vars: 1,
      consts: [[1, "flex", "h-screen", "overflow-hidden", "bg-background"], [1, "flex-1", "overflow-y-auto", "h-full", "min-h-0"], [1, "toast-host"], ["class", "toast", 3, "error", "success", "click", 4, "ngFor", "ngForOf"], [1, "toast", 3, "click"], [1, "t-title"], ["class", "t-desc", 4, "ngIf"], [1, "t-desc"]],
      template: function AppComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](0, "div", 0);
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelement"](1, "app-sidebar");
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](2, "main", 1);
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelement"](3, "router-outlet");
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementEnd"]()();
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementStart"](4, "div", 2);
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵtemplate"](5, AppComponent_div_5_Template, 4, 6, "div", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵelementEnd"]();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵadvance"](5);
          _angular_core__WEBPACK_IMPORTED_MODULE_2__["ɵɵproperty"]("ngForOf", ctx.toasts.items());
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_3__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_3__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_3__.NgIf, _angular_router__WEBPACK_IMPORTED_MODULE_4__.RouterOutlet, _shared_layout_sidebar_component__WEBPACK_IMPORTED_MODULE_0__.SidebarComponent],
      encapsulation: 2
    });
  }
}

/***/ }),

/***/ 289:
/*!*******************************!*\
  !*** ./src/app/app.config.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   appConfig: () => (/* binding */ appConfig)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/router */ 5072);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common/http */ 6443);
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/platform-browser/animations */ 3835);
/* harmony import */ var lucide_angular__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lucide-angular */ 4284);
/* harmony import */ var _app_routes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app.routes */ 2181);






const appConfig = {
  providers: [(0,_angular_router__WEBPACK_IMPORTED_MODULE_1__.provideRouter)(_app_routes__WEBPACK_IMPORTED_MODULE_0__.routes), (0,_angular_common_http__WEBPACK_IMPORTED_MODULE_2__.provideHttpClient)(), (0,_angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_3__.provideAnimations)(), (0,_angular_core__WEBPACK_IMPORTED_MODULE_4__.importProvidersFrom)(lucide_angular__WEBPACK_IMPORTED_MODULE_5__.LucideAngularModule.pick({
    Activity: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Activity,
    Map: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Map,
    Bell: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Bell,
    FlaskConical: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.FlaskConical,
    ChevronRight: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.ChevronRight,
    Building2: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Building2,
    Users: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Users,
    BedDouble: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.BedDouble,
    AlertTriangle: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.AlertTriangle,
    Wrench: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Wrench,
    Stethoscope: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Stethoscope,
    UserCheck: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.UserCheck,
    ArrowLeft: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.ArrowLeft,
    Settings: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Settings,
    Package: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Package,
    Brain: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Brain,
    PlayCircle: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.PlayCircle,
    ChevronDown: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.ChevronDown,
    ChevronUp: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.ChevronUp,
    Heart: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Heart,
    Scissors: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Scissors,
    TrendingUp: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.TrendingUp,
    TrendingDown: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.TrendingDown,
    CheckCircle2: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.CheckCircle2,
    AlertCircle: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.AlertCircle,
    FileText: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.FileText,
    Loader2: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Loader2,
    Eye: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Eye,
    ArrowLeftRight: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.ArrowLeftRight,
    Plus: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Plus,
    Trash2: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Trash2,
    X: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.X,
    Bed: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.Bed,
    HeartPulse: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.HeartPulse,
    GraduationCap: lucide_angular__WEBPACK_IMPORTED_MODULE_5__.GraduationCap
  }))]
};

/***/ }),

/***/ 2181:
/*!*******************************!*\
  !*** ./src/app/app.routes.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   routes: () => (/* binding */ routes)
/* harmony export */ });
const routes = [{
  path: '',
  loadComponent: () => __webpack_require__.e(/*! import() */ "src_app_pages_map_map_component_ts").then(__webpack_require__.bind(__webpack_require__, /*! ./pages/map/map.component */ 8515)).then(m => m.MapComponent)
}, {
  path: 'hospitals/:id',
  loadComponent: () => __webpack_require__.e(/*! import() */ "src_app_pages_hospital-dashboard_hospital-dashboard_component_ts").then(__webpack_require__.bind(__webpack_require__, /*! ./pages/hospital-dashboard/hospital-dashboard.component */ 9943)).then(m => m.HospitalDashboardComponent)
}, {
  path: 'hospitals/:id/services',
  loadComponent: () => __webpack_require__.e(/*! import() */ "src_app_pages_services_services_component_ts").then(__webpack_require__.bind(__webpack_require__, /*! ./pages/services/services.component */ 6693)).then(m => m.ServicesComponent)
}, {
  path: 'simulation',
  loadComponent: () => Promise.all(/*! import() */[__webpack_require__.e("common"), __webpack_require__.e("src_app_pages_simulation_simulation_component_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ./pages/simulation/simulation.component */ 9399)).then(m => m.SimulationComponent)
}, {
  path: 'simulation-result',
  loadComponent: () => Promise.all(/*! import() */[__webpack_require__.e("common"), __webpack_require__.e("src_app_pages_simulation_simulation-result_component_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ./pages/simulation/simulation-result.component */ 5959)).then(m => m.SimulationResultComponent)
}, {
  path: 'alerts',
  loadComponent: () => __webpack_require__.e(/*! import() */ "src_app_pages_alerts_alerts_component_ts").then(__webpack_require__.bind(__webpack_require__, /*! ./pages/alerts/alerts.component */ 1079)).then(m => m.AlertsComponent)
}, {
  path: '**',
  redirectTo: ''
}];

/***/ }),

/***/ 2571:
/*!***************************************!*\
  !*** ./src/app/shared/api.service.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ApiService: () => (/* binding */ ApiService)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common/http */ 6443);



const BASE = 'http://127.0.0.1:8000/api';
class ApiService {
  constructor() {
    this.http = (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.inject)(_angular_common_http__WEBPACK_IMPORTED_MODULE_1__.HttpClient);
  }
  listHospitals() {
    return this.http.get(`${BASE}/hospitals`);
  }
  getHospital(id) {
    return this.http.get(`${BASE}/hospitals/${id}`);
  }
  getHospitalDashboard(id) {
    return this.http.get(`${BASE}/hospitals/${id}/dashboard`);
  }
  getHospitalAlerts(id) {
    return this.http.get(`${BASE}/hospitals/${id}/alerts`);
  }
  listServices(hospitalId) {
    return this.http.get(`${BASE}/hospitals/${hospitalId}/services`);
  }
  createService(hospitalId, data) {
    return this.http.post(`${BASE}/hospitals/${hospitalId}/services`, data);
  }
  deleteService(serviceId) {
    return this.http.delete(`${BASE}/services/${serviceId}`);
  }
  addServiceEquipment(serviceId, data) {
    return this.http.post(`${BASE}/services/${serviceId}/equipment`, data);
  }
  transferStaff(serviceId, body) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-staff`, body);
  }
  transferEquipment(serviceId, body) {
    return this.http.post(`${BASE}/services/${serviceId}/transfer-equipment`, body);
  }
  getSummary() {
    return this.http.get(`${BASE}/summary`);
  }
  listAlerts() {
    return this.http.get(`${BASE}/alerts`);
  }
  runSimulation(data) {
    return this.http.post(`${BASE}/simulations`, data);
  }
  applyScenario(hospitalId, data) {
    return this.http.patch(`${BASE}/hospitals/${hospitalId}/apply-scenario`, data);
  }
  static {
    this.ɵfac = function ApiService_Factory(t) {
      return new (t || ApiService)();
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({
      token: ApiService,
      factory: ApiService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 2056:
/*!****************************************************!*\
  !*** ./src/app/shared/layout/sidebar.component.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SidebarComponent: () => (/* binding */ SidebarComponent)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ 7580);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ 5072);
/* harmony import */ var lucide_angular__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lucide-angular */ 4284);
/* harmony import */ var rxjs_operators__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! rxjs/operators */ 1567);
/* harmony import */ var _api_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../api.service */ 2571);









function SidebarComponent_div_10_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "div", 17)(1, "div", 18);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](2, "Vue d'ensemble");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](3, "div", 19)(4, "div")(5, "div", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](7, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](8, "Structures");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](9, "div")(10, "div", 20);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](11);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](12, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](13, "Patients");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](14, "div")(15, "div", 22);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](16);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](17, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](18, "Alertes");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](19, "div")(20, "div", 23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](22, "span", 24);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](23);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](24, "div", 21);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](25, "Services critiques");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()()();
  }
  if (rf & 2) {
    const s_r1 = ctx.ngIf;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](6);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](s_r1.totalHospitals);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](5);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](s_r1.totalPatients);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](s_r1.activeAlerts > 0 ? "text-orange-400" : "text-white");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](s_r1.activeAlerts);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵclassMap"](s_r1.overallLoadStatus === "critical" ? "text-red-400" : s_r1.overallLoadStatus === "high" ? "text-orange-400" : "text-green-400");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"](" ", s_r1.criticalServices, " ");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate1"]("(", ctx_r1.statusLabel(s_r1.overallLoadStatus), ")");
  }
}
function SidebarComponent_a_14_lucide_icon_4_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](0, "lucide-icon", 28);
  }
}
function SidebarComponent_a_14_Template(rf, ctx) {
  if (rf & 1) {
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "a", 25);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](1, "lucide-icon", 26);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](2, "span", 14);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](3);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](4, SidebarComponent_a_14_lucide_icon_4_Template, 1, 0, "lucide-icon", 27);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
  }
  if (rf & 2) {
    const n_r3 = ctx.$implicit;
    const ctx_r1 = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵnextContext"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵstyleProp"]("background-color", ctx_r1.isActive(n_r3.path) ? "#00BCD4" : "");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("routerLink", n_r3.path)("ngClass", ctx_r1.isActive(n_r3.path) ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10");
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵattribute"]("data-testid", n_r3.testid);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("name", n_r3.icon);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](2);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtextInterpolate"](n_r3.label);
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"]();
    _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx_r1.isActive(n_r3.path));
  }
}
class SidebarComponent {
  constructor() {
    this.api = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_api_service__WEBPACK_IMPORTED_MODULE_0__.ApiService);
    this.router = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.inject)(_angular_router__WEBPACK_IMPORTED_MODULE_2__.Router);
    this.summary = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)(null);
    this.currentUrl = (0,_angular_core__WEBPACK_IMPORTED_MODULE_1__.signal)('/');
    this.navItems = [{
      path: '/',
      label: 'Vue Carte',
      icon: 'map',
      testid: 'nav-vue-carte'
    }, {
      path: '/alerts',
      label: 'Alertes',
      icon: 'bell',
      testid: 'nav-alertes'
    }, {
      path: '/simulation',
      label: 'Centre de Simulation',
      icon: 'flask-conical',
      testid: 'nav-centre-de-simulation'
    }];
  }
  ngOnInit() {
    this.refreshSummary();
    this.currentUrl.set(this.router.url);
    this.router.events.pipe((0,rxjs_operators__WEBPACK_IMPORTED_MODULE_3__.filter)(e => e instanceof _angular_router__WEBPACK_IMPORTED_MODULE_2__.NavigationEnd)).subscribe(e => {
      this.currentUrl.set(e.urlAfterRedirects);
      this.refreshSummary();
    });
  }
  refreshSummary() {
    this.api.getSummary().subscribe({
      next: s => this.summary.set(s),
      error: () => {}
    });
  }
  isActive(path) {
    return this.currentUrl() === path;
  }
  hospitalsActive() {
    return this.currentUrl().startsWith('/hospitals');
  }
  statusLabel(s) {
    return s === 'critical' ? 'CRITIQUE' : s === 'high' ? 'ÉLEVÉE' : 'NORMALE';
  }
  static {
    this.ɵfac = function SidebarComponent_Factory(t) {
      return new (t || SidebarComponent)();
    };
  }
  static {
    this.ɵcmp = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineComponent"]({
      type: SidebarComponent,
      selectors: [["app-sidebar"]],
      standalone: true,
      features: [_angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵStandaloneFeature"]],
      decls: 24,
      vars: 3,
      consts: [[1, "w-64", "flex-shrink-0", "flex", "flex-col", "h-screen", 2, "background-color", "#2C3136"], [1, "px-6", "py-5", "border-b", "border-white/10"], [1, "flex", "items-center", "gap-3"], [1, "w-9", "h-9", "rounded-lg", "flex", "items-center", "justify-center", 2, "background", "linear-gradient(135deg, #00BCD4, #0097A7)"], ["name", "activity", 1, "w-5", "h-5", "text-white"], [1, "text-white", "font-bold", "text-lg", "leading-tight", "font-display"], [1, "text-white/50", "text-xs"], ["class", "mx-4 mt-4 px-3 py-2.5 rounded-lg", "style", "background-color: rgba(255,255,255,0.06);", 4, "ngIf"], [1, "flex-1", "px-3", "py-4", "space-y-1", "overflow-y-auto"], [1, "text-white/30", "text-xs", "uppercase", "tracking-wider", "px-3", "mb-2"], ["class", "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all", 3, "routerLink", "ngClass", "backgroundColor", 4, "ngFor", "ngForOf"], [1, "text-white/30", "text-xs", "uppercase", "tracking-wider", "px-3", "mt-5", "mb-2"], ["routerLink", "/", 1, "flex", "items-center", "gap-3", "px-3", "py-2.5", "rounded-lg", "cursor-pointer", "transition-all", 3, "ngClass"], ["name", "building-2", 1, "w-4", "h-4", "flex-shrink-0"], [1, "text-sm", "font-medium"], [1, "px-6", "py-4", "border-t", "border-white/10"], [1, "text-white/30", "text-xs"], [1, "mx-4", "mt-4", "px-3", "py-2.5", "rounded-lg", 2, "background-color", "rgba(255,255,255,0.06)"], [1, "text-white/50", "text-xs", "uppercase", "tracking-wider", "mb-2"], [1, "grid", "grid-cols-2", "gap-2"], [1, "text-white", "text-sm", "font-semibold"], [1, "text-white/40", "text-xs"], [1, "text-sm", "font-semibold"], ["data-testid", "text-system-load", 1, "text-sm", "font-semibold"], [1, "text-[11px]", "font-normal", "opacity-80", "ml-1"], [1, "flex", "items-center", "gap-3", "px-3", "py-2.5", "rounded-lg", "cursor-pointer", "transition-all", 3, "routerLink", "ngClass"], [1, "w-4", "h-4", "flex-shrink-0", 3, "name"], ["name", "chevron-right", "class", "w-3 h-3 ml-auto", 4, "ngIf"], ["name", "chevron-right", 1, "w-3", "h-3", "ml-auto"]],
      template: function SidebarComponent_Template(rf, ctx) {
        if (rf & 1) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](0, "aside", 0)(1, "div", 1)(2, "div", 2)(3, "div", 3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](4, "lucide-icon", 4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](5, "div")(6, "div", 5);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](7, "HealthSim");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](8, "div", 6);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](9, "Decision Support System");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](10, SidebarComponent_div_10_Template, 26, 9, "div", 7);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](11, "nav", 8)(12, "div", 9);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](13, "Navigation");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtemplate"](14, SidebarComponent_a_14_Template, 5, 8, "a", 10);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](15, "div", 11);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](16, "Structures");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](17, "a", 12);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelement"](18, "lucide-icon", 13);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](19, "span", 14);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](20, "Toutes les structures");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementStart"](21, "div", 15)(22, "div", 16);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵtext"](23, "HealthSim v1.0 \u2014 Algeria");
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵelementEnd"]()()();
        }
        if (rf & 2) {
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](10);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngIf", ctx.summary());
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](4);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngForOf", ctx.navItems);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵadvance"](3);
          _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵproperty"]("ngClass", ctx.hospitalsActive() ? "text-white/90 bg-white/10" : "text-white/60 hover:text-white hover:bg-white/10");
        }
      },
      dependencies: [_angular_common__WEBPACK_IMPORTED_MODULE_4__.CommonModule, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgClass, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgForOf, _angular_common__WEBPACK_IMPORTED_MODULE_4__.NgIf, _angular_router__WEBPACK_IMPORTED_MODULE_2__.RouterLink, lucide_angular__WEBPACK_IMPORTED_MODULE_5__.LucideAngularModule, lucide_angular__WEBPACK_IMPORTED_MODULE_5__.LucideAngularComponent],
      encapsulation: 2
    });
  }
}

/***/ }),

/***/ 1556:
/*!*****************************************!*\
  !*** ./src/app/shared/toast.service.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ToastService: () => (/* binding */ ToastService)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 7580);


class ToastService {
  constructor() {
    this.nextId = 1;
    this.items = (0,_angular_core__WEBPACK_IMPORTED_MODULE_0__.signal)([]);
  }
  show(t) {
    const id = this.nextId++;
    this.items.update(arr => [...arr, {
      id,
      ...t
    }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
  dismiss(id) {
    this.items.update(arr => arr.filter(x => x.id !== id));
  }
  static {
    this.ɵfac = function ToastService_Factory(t) {
      return new (t || ToastService)();
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({
      token: ToastService,
      factory: ToastService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ }),

/***/ 4429:
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @angular/platform-browser */ 436);
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ 316);
/* harmony import */ var _angular_common_locales_fr__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/common/locales/fr */ 5669);
/* harmony import */ var _app_app_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app/app.component */ 92);
/* harmony import */ var _app_app_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./app/app.config */ 289);





(0,_angular_common__WEBPACK_IMPORTED_MODULE_2__.registerLocaleData)(_angular_common_locales_fr__WEBPACK_IMPORTED_MODULE_3__["default"]);
(0,_angular_platform_browser__WEBPACK_IMPORTED_MODULE_4__.bootstrapApplication)(_app_app_component__WEBPACK_IMPORTED_MODULE_0__.AppComponent, _app_app_config__WEBPACK_IMPORTED_MODULE_1__.appConfig).catch(err => console.error(err));

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, ["vendor"], () => (__webpack_exec__(4429)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=main.js.map