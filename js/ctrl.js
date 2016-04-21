app.controller('ctrl', function ($scope, $injector) {
    $scope.level = 0;  // track current level of input to display the panel needed

    // level 0 /////////////////////////////////////////////////////////////////////////////////////////////////////////
    $scope.getAvailableAlgorithmNames = function () {  // list of available algorithms
        return algorithms.map(function (element) {
            return element.name;
        })
    };
    $scope.selectAlgorithm = function (name) {  // select an algorithm by name
        for (var ai = 0; ai < algorithms.length; ai++) {
            if (algorithms[ai].name == name) {
                $scope.selectedAlgorithm = algorithms[ai];
                $scope.algorithmParameters = algorithms[ai].func.algorithmFlagsIn;
                $scope.algorithmArguments = {};
                for (var aai = 0; aai < $scope.algorithmParameters.length; aai++) {
                    $scope.algorithmArguments[$scope.algorithmParameters[aai].flag]
                        = eval($scope.algorithmParameters[aai].initial);
                }
            }
        }
    };
    $scope.selectedAlgorithm = algorithms[0];  // here, the algorithm is an object with a name and a function
    $scope.algorithmParameters = algorithms[0].func.algorithmFlagsIn;
    $scope.algorithmArguments = (function () {
        var args = {};
        for (var aai = 0; aai < $scope.algorithmParameters.length; aai++) {
            args[$scope.algorithmParameters[aai].flag]
                = eval($scope.algorithmParameters[aai].initial);
        }
        return args;
    })();
    $scope.createScheduler = function () {
        var scheduler = new Scheduler($scope.selectedAlgorithm.func);
        var args = [];
        for (var aci = 0; aci < $scope.algorithmParameters.length; aci++) {
            args.push($scope.algorithmArguments[$scope.algorithmParameters[aci].flag]);
        }
        scheduler.algorithm.apply(scheduler, args);
        $scope.scheduler = scheduler;
        $scope.level = 1;  // increase level
    };
    $scope.isValidScheduler = function () {
        return _.every(_.values($scope.algorithmArguments), function (val) {
            return _.isFinite(val) && val >= 0;
        })
    };
    $scope.scheduler = null;  // IMPORTANT FOR THE NEXT LEVEL!

    // level 1 /////////////////////////////////////////////////////////////////////////////////////////////////////////
    $scope.processParameters = $scope.selectedAlgorithm.func.processFlagsIn;
    $scope.processArguments = {};
    $scope.clearProcess = function () {
        var args = {};
        for (var pai = 0; pai < $scope.processParameters.length; pai++) {
            args[$scope.processParameters[pai].flag]
                = eval($scope.processParameters[pai].initial);  // evaluate initial value
        }
        $scope.processArguments = args;
    };
    $scope.clearProcess();
    $scope.isValidProcess = function () {
        return _.every(_.keys($scope.processArguments), function (key) {
            var val = $scope.processArguments[key];
            return (_.isFinite(val) && val >= 0) || key == 'name';  // name may not be a number
        })
    };
    $scope.processes = [];
    $scope.addProcess = function () {
        $scope.processes.push();
    }

});
// TODO use underscore.js to simplify the above expressions