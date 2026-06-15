"use strict";
(self["webpackChunkhealthsim"] = self["webpackChunkhealthsim"] || []).push([["common"],{

/***/ 4722:
/*!****************************************************!*\
  !*** ./src/app/shared/simulation-store.service.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SimulationStoreService: () => (/* binding */ SimulationStoreService)
/* harmony export */ });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ 7580);

class SimulationStoreService {
  constructor() {
    this.last = null;
  }
  set(data) {
    this.last = data;
  }
  get() {
    return this.last;
  }
  static {
    this.ɵfac = function SimulationStoreService_Factory(t) {
      return new (t || SimulationStoreService)();
    };
  }
  static {
    this.ɵprov = /*@__PURE__*/_angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({
      token: SimulationStoreService,
      factory: SimulationStoreService.ɵfac,
      providedIn: 'root'
    });
  }
}

/***/ })

}]);
//# sourceMappingURL=common.js.map