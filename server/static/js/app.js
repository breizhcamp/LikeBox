'use strict';

var breizhcampRoom = angular.module('BreizhcampRoom', []);


breizhcampRoom.controller('ScheduleController', function ($scope, $http, $timeout, $filter, $location) {

    $scope.day = $location.search()['day'];

    $scope.updateTime = function() {
		var now = new Date();

		//select right day if not defined
		if (!$scope.day) {
			$scope.day = 0;

			var curDay = $filter('date')(now, "dd/MM/yyyy");
			for (var i = 0; i < $scope.schedule.programme.jours.length; i++) {
				if (curDay == $scope.schedule.programme.jours[i].date) {
					$scope.day = i;
					break;
				}
			}
		}


        $scope.time = $filter('date')(now, "H:mm");
        $scope.timeInSeconds = now.getHours() * 60 + now.getMinutes();

        $scope.talks = [];
        $scope.nextTalks = [];

        angular.forEach($scope.schedule.programme.jours[$scope.day].tracks, function(track) {
            var takeNext = true;
            if (track.type === "Miam") return;
            angular.forEach(track.proposals, function(talk) {

                if ($scope.isOnAir(talk)) {
                    $scope.talks.push(talk);
                }

                if (takeNext && $scope.isAfter(talk)) {
                    $scope.nextTalks.push(talk);
                    takeNext = false;
                }

            });
        });

        $timeout($scope.updateTime, 60000);
    };

    $scope.isOnAir = function(talk) {
        var startInSeconds = $scope.getTimeInSeconds(talk.start);
        var endInSeconds = $scope.getTimeInSeconds(talk.end);
        return startInSeconds <= $scope.timeInSeconds && endInSeconds > $scope.timeInSeconds;
    };

    $scope.isAfter = function(talk) {
        var startInSeconds = $scope.getTimeInSeconds(talk.start);
        return startInSeconds > $scope.timeInSeconds;
    };

    $scope.getTimeInSeconds = function(time) {
        var splits = time.split(':');
        return parseInt(splits[0]) * 60 + parseInt(splits[1]);
    };

//    window.getSchedule = function(schedule) {
//        $scope.schedule = schedule;
//        $scope.updateTime();
//    };

//    $http.jsonp("http://www.breizhcamp.org/json/schedule.json.js");

    $http.get("/program")
         .success(function(data) {
             $scope.schedule = data;
             $scope.updateTime();
         });


});
