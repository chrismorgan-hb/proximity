'use strict';

angular.module('proximity.controllers', []).
  controller('HomeCtrl', ['$scope', '$http', 'ga',
    function($scope, $http, ga) {
      ga('send', 'pageview', {title: 'Home'});
      $scope.userLocationMarker = {
        coords: {
          latitude: 45,
          longitude: -73
        }
      };
      $scope.map = {
          center: $scope.userLocationMarker.coords,
          zoom: 8
      };
  }]);
