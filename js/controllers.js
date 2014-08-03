'use strict';

angular.module('proximity.controllers', []).
  controller('HomeCtrl', ['$scope', '$http', '$q', 'ga', 'geolocation',
    function($scope, $http, $q, ga, geolocation) {
      ga('send', 'pageview', {title: 'Home'});
      $scope.userLocationMarker = {};
      $scope.map = {};
      $scope.gMap = {};
      $scope.searchRadius = 3200; // meters

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

      // TODO: Pick a better starting point in case the user doesn't allow
      // geolocation.
      $scope.setUserLocationMarker(33.744433, -118.015762, true);
      geolocation.getLocation().then(function(data) {
        $scope.setUserLocationMarker(
          data.coords.latitude, data.coords.longitude, true);
      });

      $scope.increaseRadius = function() {
        if ($scope.searchRadius < 8000) {
          ga('send', 'event', 'button', 'click', 'increaseRadius',
             $scope.searchRadius); 
          $scope.searchRadius += 1600;
          $scope.rankLocation($scope.userLocationMarker.coords.latitude,
                              $scope.userLocationMarker.coords.longitude);
        }
      };

      $scope.decreaseRadius = function() {
        if ($scope.searchRadius > 1600) {
          ga('send', 'event', 'button', 'click', 'decreaseRadius',
             $scope.searchRadius);
          $scope.searchRadius -= 1600;
          $scope.rankLocation($scope.userLocationMarker.coords.latitude,
                              $scope.userLocationMarker.coords.longitude);
        }
      };

      $scope.map = {
        center: $scope.userLocationMarker.coords,
        zoom: 12,
        typeMarkers: [],
        doClusterTypeMarkers: true,
        events: {
          tilesloaded: function(map) {
            $scope.$apply(function() {
              $scope.gMap = map;
            });
          },
          click: function(mapModel, eventName, originalEventArgs) {
            ga('send', 'event', 'image', 'click', 'map');
            var e = originalEventArgs[0];
            var lat = e.latLng.lat(), lon = e.latLng.lng();
            $scope.setUserLocationMarker(lat, lon, false);
            $scope.map.typeMarkers = [];
            $scope.addressInput = ""; 
            $scope.$apply();
            $scope.rankLocation(lat, lon);
          }
        }
      };

      $scope.getLocation = function(val) {
        // We don't use the Geocoder class here because of rate limiting
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
        ga('send', 'event', 'input', 'select', 'address');
        var geocodeAddress = function(address) {
          var geocoder = new google.maps.Geocoder();
          var d = $q.defer();
          geocoder.geocode( { 'address': address }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              d.resolve(results);
            } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
              d.resolve([]);
            } else {
              alert("Geocode was not successful for the following reason: " 
                    + status);
              d.resolve([]);
            }
          });
          return d.promise;
        };
        geocodeAddress($label).then(function(results) {
          var lat = results[0].geometry.location.lat();
          var lon = results[0].geometry.location.lng();
          $scope.setUserLocationMarker(lat, lon, true);
          $scope.rankLocation(lat, lon);
        });
      };

      $scope.types = [
        {
          tag: 'grocery_or_supermarket',
          score: -1,
          name: 'Groceries'
        },
        {
          tag: 'gas_station',
          score: -1,
          name: 'Gas Stations'
        },
        {
          tag: 'restaurant',
          score: -1,
          name: 'Restaurants'
        },
        {
          tag: 'atm',
          score: -1,
          name: 'ATMs'
        },
        {
          tag: 'pharmacy',
          score: -1,
          name: 'Pharmacies'
        },
        {
          tag: 'hardware_store',
          score: -1,
          name: 'Hardware Stores'
        },
        {
          tag: 'park',
          score: -1,
          name: 'Parks'
        }
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
              type.score = results.length / 10;
              console.log(type.tag + ": " + results.length);
              break;
            case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              type.score = 0;
              console.log(type.tag + ": " + 0);
              break;
            default:
              alert(type.tag + ": " + status);
              return;
          }
          $scope.$apply();
        };

        var latLng = new google.maps.LatLng(lat, lon);
        var request = {
          location: latLng,
          radius: $scope.searchRadius,
          types: [type.tag]
        };

        var placesService = new google.maps.places.PlacesService($scope.gMap);
        placesService.radarSearch(request, callback);
      };

      $scope.searchNearby = function(tag) {
        var callback = function(results, status) {
          switch(status) {
            case google.maps.places.PlacesServiceStatus.OK:
              var typeMarkerClicked = function(marker) {
                // TODO: Seems like this doesn't work after clicking close
                // because angular doesn't realize the model changed.
                marker.showWindow = true;
                console.log(marker);
                $scope.$apply();
              };
              var typeMarkerCloseClicked = function(marker) {
                marker.showWindow = false;
                $scope.$apply();
              };
              angular.forEach(results, function(item) {
                var marker = {
                    idKey: item.id,
                    latitude: item.geometry.location.lat(),
                    longitude: item.geometry.location.lng(),
                    title: item.name,
                    showWindow: false,
                  };
                marker.onClicked = function() {
                  typeMarkerClicked(marker);
                };
                marker.closeClicked = function() {
                  typeMarkerCloseClicked(marker);
                };
                $scope.map.typeMarkers.push(marker);
              });
              // TODO: Make the markers clickable with info windows
              // TODO: Expand the category listing
              break;
            case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              break;
            default:
              alert(type.tag + ": " + status);
              return;
          }
          $scope.$apply();
        };
        $scope.map.typeMarkers = [];
        var latLng = new google.maps.LatLng(
          $scope.userLocationMarker.coords.latitude,
          $scope.userLocationMarker.coords.longitude);
        var request = {
          location: latLng,
          radius: $scope.searchRadius,
          rankBy: google.maps.places.RankBy.PROMINENCE,
          types: [tag]
        };
        var placesService = new google.maps.places.PlacesService($scope.gMap);
        placesService.nearbySearch(request, callback);
      };
  }]);
