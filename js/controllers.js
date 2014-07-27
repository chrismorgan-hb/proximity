'use strict';

angular.module('proximity.controllers', []).
  controller('HomeCtrl', ['$scope', '$http', 'ga',
    function($scope, $http, ga) {
      ga('send', 'pageview', {title: 'Home'});
      $scope.userLocationMarker = {
        coords: {
          latitude: 33.744433,
          longitude: -118.015762
        }
      };
      $scope.map = {
          center: $scope.userLocationMarker.coords,
          zoom: 13,
          events: {
            click: function (mapModel, eventName, originalEventArgs) {
              var e = originalEventArgs[0];
              var lat = e.latLng.lat(), lon = e.latLng.lng();
              $scope.userLocationMarker = {
                coords: {
                  latitude: lat,
                  longitude: lon
                }
              };
              $scope.$apply();
            }
          }
      };
  }]);
