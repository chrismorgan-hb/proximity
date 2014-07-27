'use strict';


// Declare app level module which depends on filters, and services
angular.module('proximity', [
  'ga',
  'google-maps',
  'ngRoute',
  'proximity.filters',
  'proximity.services',
  'proximity.directives',
  'proximity.controllers',
  'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
      templateUrl: 'partials/home.html', 
      controller: 'HomeCtrl'});
  $routeProvider.otherwise({redirectTo: '/home'});
}]);
