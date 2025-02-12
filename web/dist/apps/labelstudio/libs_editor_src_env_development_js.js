"use strict";
(self["webpackChunklabelstudio"] = self["webpackChunklabelstudio"] || []).push([["libs_editor_src_env_development_js"],{

/***/ "../../libs/editor/src/env/development.js":
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _core_External__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../../libs/editor/src/core/External.js");
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../../libs/editor/src/utils/messages.jsx");
/* harmony import */ var _examples_classification_mixed__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("../../libs/editor/src/examples/classification_mixed/index.js");
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */




/**
 * Custom Data
 */
// import { AllTypes } from "../examples/all_types";

const data = _examples_classification_mixed__WEBPACK_IMPORTED_MODULE_2__.ClassificationMixed;
function getData(task) {
  if (task && task.data) {
    return Object.assign({}, task, {
      data: JSON.stringify(task.data)
    });
  }
  return task;
}

/**
 * Get current config
 * @param {string} pathToConfig
 */
async function getConfig(pathToConfig) {
  const response = await fetch(pathToConfig);
  const config = await response.text();
  return config;
}

/**
 * Get custom config
 */
async function getExample() {
  const datatype = data;
  const config = await getConfig(datatype.config);
  const annotations = datatype.annotation.annotations;
  const predictions = datatype.tasks[0].predictions;
  const task = {
    annotations,
    predictions,
    data: JSON.stringify(datatype.tasks[0].data)
  };
  return {
    config,
    task,
    annotations,
    predictions
  };
}

/**
 * Function to return App element
 */
function rootElement(element) {
  let root;
  if (typeof element === "string") {
    root = document.getElementById(element);
  } else {
    root = element;
  }
  root.innerHTML = "";
  root.style.width = "auto";
  return root;
}

/**
 * Function to configure application with callbacks
 * @param {object} params
 */
function configureApplication(params) {
  var _params$forceAutoAnno, _params$forceAutoAcce;
  const options = {
    settings: params.settings || {},
    messages: Object.assign({}, _utils_messages__WEBPACK_IMPORTED_MODULE_1__["default"], params.messages),
    onSubmitAnnotation: params.onSubmitAnnotation ? params.onSubmitAnnotation : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onSubmitAnnotation,
    onUpdateAnnotation: params.onUpdateAnnotation ? params.onUpdateAnnotation : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onUpdateAnnotation,
    onDeleteAnnotation: params.onDeleteAnnotation ? params.onDeleteAnnotation : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onDeleteAnnotation,
    onSkipTask: params.onSkipTask ? params.onSkipTask : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onSkipTask,
    onUnskipTask: params.onUnskipTask ? params.onUnskipTask : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onUnskipTask,
    onPresignUrlForProject: params.onPresignUrlForProject,
    onSubmitDraft: params.onSubmitDraft,
    onTaskLoad: params.onTaskLoad ? params.onTaskLoad : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onTaskLoad,
    onLabelStudioLoad: params.onLabelStudioLoad ? params.onLabelStudioLoad : _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onLabelStudioLoad,
    onEntityCreate: params.onEntityCreate || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onEntityCreate,
    onEntityDelete: params.onEntityDelete || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onEntityDelete,
    onGroundTruth: params.onGroundTruth || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onGroundTruth,
    onSelectAnnotation: params.onSelectAnnotation || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onSelectAnnotation,
    onAcceptAnnotation: params.onAcceptAnnotation || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onAcceptAnnotation,
    onRejectAnnotation: params.onRejectAnnotation || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onRejectAnnotation,
    onStorageInitialized: params.onStorageInitialized || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onStorageInitialized,
    onNextTask: params.onNextTask || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onNextTask,
    onPrevTask: params.onPrevTask || _core_External__WEBPACK_IMPORTED_MODULE_0__["default"].onPrevTask,
    // other settings aka flags
    forceAutoAnnotation: (_params$forceAutoAnno = params.forceAutoAnnotation) != null ? _params$forceAutoAnno : false,
    forceAutoAcceptSuggestions: (_params$forceAutoAcce = params.forceAutoAcceptSuggestions) != null ? _params$forceAutoAcce : false
  };
  return options;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  rootElement,
  getExample,
  getData,
  configureApplication
});

/***/ }),

/***/ "../../libs/editor/src/examples/classification_mixed/index.js":
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClassificationMixed: () => (/* binding */ ClassificationMixed)
/* harmony export */ });
/* harmony import */ var _config_xml__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("../../libs/editor/src/examples/classification_mixed/config.xml");
/* harmony import */ var _tasks_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../../libs/editor/src/examples/classification_mixed/tasks.json");
/* harmony import */ var _annotations_1_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../../libs/editor/src/examples/classification_mixed/annotations/1.json");



const ClassificationMixed = {
  config: _config_xml__WEBPACK_IMPORTED_MODULE_2__["default"],
  tasks: _tasks_json__WEBPACK_IMPORTED_MODULE_0__,
  annotation: _annotations_1_json__WEBPACK_IMPORTED_MODULE_1__
};

/***/ }),

/***/ "../../libs/editor/src/examples/classification_mixed/config.xml":
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ("data:application/xml;base64,PFZpZXc+CiAgPExhYmVscyBuYW1lPSJsYWJlbCIgdG9OYW1lPSJ0ZXh0Ij4KICAgIDxMYWJlbCB2YWx1ZT0iU2ltcGxlIiAvPgogICAgPExhYmVsIHZhbHVlPSJDb21wbGV4IiAvPgogIDwvTGFiZWxzPgogIDxUZXh0IG5hbWU9InRleHQiIHZhbHVlPSJKdXN0IHNvbWUgcmFuZG9tIHRleHQgdG8gbGFiZWwiPjwvVGV4dD4KCiAgPE51bWJlciBuYW1lPSJudW0iIHRvTmFtZT0idGV4dCIgbWluPSIxIiBtYXg9IjEwIi8+CiAgPERhdGVUaW1lIG5hbWU9ImR0IiB0b05hbWU9InRleHQiIHNob3dEYXRlPSJ0cnVlIiBzaG93VGltZT0idHJ1ZSIvPgogIDxUZXh0QXJlYSBuYW1lPSJ0eHQiIHRvTmFtZT0idGV4dCIgZWRpdGFibGU9InRydWUiLz4KICA8VmlldyB2aXNpYmxlV2hlbj0icmVnaW9uLXNlbGVjdGVkIj4KICAgIDxIZWFkZXIgc2l6ZT0iMyI+cGVyLXJlZ2lvbiBUZXh0QXJlYTwvSGVhZGVyPgogICAgPFRleHRBcmVhIG5hbWU9InR4dDIiIHRvTmFtZT0idGV4dCIgZWRpdGFibGU9InRydWUiIHBlclJlZ2lvbj0idHJ1ZSIvPgogIDwvVmlldz4KCiAgPENob2ljZXMgbmFtZT0iY2hvaWNlcyIgdG9OYW1lPSJ0ZXh0Ij4KICAgIDxDaG9pY2UgdmFsdWU9IkNob2ljZSAxIiBiYWNrZ3JvdW5kPSIjNWI1Ii8+CiAgICA8Q2hvaWNlIHZhbHVlPSJDaG9pY2UgMiIgYmFja2dyb3VuZD0iIzU1ZiIvPgogIDwvQ2hvaWNlcz4KCiAgPFRheG9ub215IG5hbWU9InRheG9ub215IiB0b05hbWU9InRleHQiPgogICAgPENob2ljZSB2YWx1ZT0iQ2hvaWNlIDEiIGJhY2tncm91bmQ9IiM1YjUiIHNlbGVjdGVkPSJ0cnVlIi8+CiAgICA8Q2hvaWNlIHZhbHVlPSJDaG9pY2UgMiIgYmFja2dyb3VuZD0iIzU1ZiI+CiAgICAgIDxDaG9pY2UgdmFsdWU9IkNob2ljZSAyLjEiIGJhY2tncm91bmQ9IiM1YjUiLz4KICAgICAgPENob2ljZSB2YWx1ZT0iQ2hvaWNlIDIuMiIgYmFja2dyb3VuZD0iIzU1ZiIvPgogICAgPC9DaG9pY2U+CiAgPC9UYXhvbm9teT4KPC9WaWV3Pgo=");

/***/ }),

/***/ "../../libs/editor/src/examples/classification_mixed/annotations/1.json":
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"annotations":[{"id":"1001","lead_time":15.053,"result":[{"value":{"number":2},"id":"W7wMwaYoa9","from_name":"num","to_name":"text","type":"number","origin":"manual"},{"value":{"datetime":"1991-05-22T09:17"},"id":"xMvgTyP6e4","from_name":"dt","to_name":"text","type":"datetime","origin":"manual"},{"value":{"text":["Hello","World"]},"id":"0yMHFegGSK","from_name":"txt","to_name":"text","type":"textarea","origin":"manual"},{"value":{"choices":["Choice 1"]},"id":"dZyZ7Dx3uS","from_name":"choices","to_name":"text","type":"choices","origin":"manual"},{"value":{"taxonomy":[["Choice 2","Choice 2.1"]]},"id":"4IHbGrfa-P","from_name":"taxonomy","to_name":"text","type":"taxonomy","origin":"manual"}]}],"data":{"image":"https://htx-pub.s3.us-east-1.amazonaws.com/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg"},"id":1,"predictions":[{"created_ago":"3 hours","model_version":"model 1","result":[{"from_name":"tag","id":"t5sp3TyXPo","source":"$image","to_name":"img","type":"rectanglelabels","value":{"height":11.612284069097889,"rectanglelabels":["Moonwalker"],"rotation":0,"width":39.6,"x":13.2,"y":34.702495201535505}}]},{"created_ago":"4 hours","model_version":"model 2","result":[{"from_name":"tag","id":"t5sp3TyXPo","source":"$image","to_name":"img","type":"rectanglelabels","value":{"height":33.61228406909789,"rectanglelabels":["Moonwalker"],"rotation":0,"width":39.6,"x":13.2,"y":54.702495201535505}}]}]}');

/***/ }),

/***/ "../../libs/editor/src/examples/classification_mixed/tasks.json":
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('[{"data":{"image":"https://htx-pub.s3.us-east-1.amazonaws.com/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg"},"predictions":[]},{"data":{"image":"https://htx-pub.s3.us-east-1.amazonaws.com/examples/images/history-in-hd-e5eDHbmHprg-unsplash.jpg"}},{"data":{"image":"https://htx-pub.s3.us-east-1.amazonaws.com/examples/images/soroush-karimi-crjPrExvShc-unsplash.jpg"}}]');

/***/ })

}]);
//# sourceMappingURL=libs_editor_src_env_development_js.js.map