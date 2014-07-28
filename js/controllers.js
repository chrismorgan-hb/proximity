'use strict';

angular.module('proximity.controllers', []).
  controller('HomeCtrl', ['$scope', '$http', 'ga',
    function($scope, $http, ga) {
      ga('send', 'pageview', {title: 'Home'});
      $scope.userLocationMarker = {};
      $scope.map = {};
      $scope.gMap = {};

      $scope.setUserLocationMarker = function(lat, lon, recenter) {
        $scope.userLocationMarker = {
          coords: {
            latitude: lat,
            longitude: lon
          }
        };
        if (recenter) {
          $scope.map.center = $scope.userLocationMarker.coords;
        }
      };

      $scope.setUserLocationMarker(33.744433, -118.015762, true);

      $scope.map = {
          center: $scope.userLocationMarker.coords,
          zoom: 13,
          events: {
            tilesloaded: function(map) {
              $scope.$apply(function() {
                $scope.gMap = map;
              });
            },
            click: function(mapModel, eventName, originalEventArgs) {
              ga('send', 'event', 'image', 'click', 'map')
              var e = originalEventArgs[0];
              var lat = e.latLng.lat(), lon = e.latLng.lng();
              $scope.setUserLocationMarker(lat, lon);
              $scope.addressInput = ""; 
              $scope.$apply();
              $scope.rankLocation(lat, lon);
            }
          }
      };

      $scope.getLocation = function(val) {
        // TODO: Switch to google.maps.Geocoder()
        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: val,
            sensor: false
          }
        }).then(function(res) {
          var addresses = [];
          angular.forEach(res.data.results, function(item) {
            addresses.push(item.formatted_address);
          });
          return addresses;
        });
      };

      $scope.onSelect = function($item, $model, $label) {
        ga('send', 'event', 'input', 'select', 'address')
        // TODO: Switch to google.maps.Geocoder()
        // TODO: Avoid the second API call
        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: $label,
            sensor: false
          }
        }).then(function(res) {
          var lat = res.data.results[0].geometry.location.lat;
          var lon = res.data.results[0].geometry.location.lng;
          $scope.setUserLocationMarker(lat, lon, true);
          $scope.rankLocation(lat, lon);
        });
      };

      $scope.types = [
        'grocery_or_supermarket',
        'gas_station',
        'restaurant',
        'atm',
        'pharmacy',
        'hardware_store',
        'park'
      ];

      $scope.rankLocation = function(lat, lon) {
        angular.forEach($scope.types, function(type) {
          $scope.rankLocationForType(lat, lon, type);
        });
      };

      $scope.rankLocationForType = function(lat, lon, type) {
        var callback = function(results, status) {
          switch(status) {
            case google.maps.places.PlacesServiceStatus.OK:
              // TODO: Populate the values in the table
              console.log(type + ": " + results.length);
              break;
            case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              // TODO: Populate the values in the table
              console.log(type + ": " + 0);
              break;
            default:
              alert(type + ": " + status);
              return;
          }
        };

        var latLng = new google.maps.LatLng(lat, lon);
        var request = {
          location: latLng,
          radius: 1600, // TODO: make this input
          types: [type]
        };

        var placesService = new google.maps.places.PlacesService($scope.gMap);
        placesService.radarSearch(request, callback);
      };
  }]);
