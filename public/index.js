/**
 * Created by daniel.irwin on 4/9/16.
 */

angular.module('hello', ['n3-line-chart']).controller('navigation', function($rootScope, $scope, $http) {
    $scope.data = {
        lights      : {},
        outlets      : {},
        powerstrips : {}
    };

    $scope.myStyle = 'width:64px;height:64px';
    var i = 0;
    $scope.icons = {};

    $scope.getIconSrcById = function getIconSrcById(type){
        if($scope.icons){
            switch(type){
                case 'binary_switch':
                    return $scope.getIcon(98);
                case 'light':
                    return $scope.getIcon(50);
                case 'powerstrip':
                    return $scope.getIcon(101);
                default :
                    return $scope.getIcon(101);
            }
        }
        return '';
    };

    $scope.getIcon = function getIcon(id){
        if($scope.icons && $scope.icons[id]){
            return $scope.icons[id].src;
        }
        return '';
    };

    $scope.updateDevice = function updateDevice(device){
        var dev = {
            path : device.path,
            desired_state : {
                powered : !device.powered,
                brightness : 0
            }
        };

        var req = {
            method: 'POST',
            url: '/update',
            'Content-Type' : 'application/json',
            data: dev
        };

        $http(req).then(function(data){
            var dv = data.data;
            dv.name = device.name;

            updateData(dv);


        }, function(err){
            console.log('err recieved from update: ',err);
        });
    };


    $scope.poweredIcon = function poweredIcon(powered){
        if(powered){
            return $scope.getIcon(183);
        }
        return $scope.getIcon(182);
    };

    var source = new EventSource('/listen');

    function handleOutlets(datum) {
        if (datum.outlets) {
            datum.outlets.forEach(function (outlet) {
                $scope.data.powerstrips[outlet.name] = {
                    name : outlet.name,
                    type: 'powerstrip',
                    path: outlet.path,
                    powered: outlet.props.powered,
                    icon_id: outlet.props.icon_id
                };
            });
        }
    }

    function handleLightbulb(datum) {
        $scope.data.lights[datum.name] = {
            name : datum.name,
            type: 'light',
            path: datum.path,
            powered: datum.props.powered,
            icon_id: datum.props.icon_id
        };
    }

    function handleBinaryswitch(datum) {
        $scope.data.outlets[datum.name] = {
            name : datum.name,
            type: 'binary_switch',
            path: datum.path,
            powered: datum.props.powered,
            icon_id: datum.props.icon_id
        };
    }

    function handleIcon(datum) {
        $scope.icons[datum.data.icon_id] = {
            src: datum.data.images.medium
        };
    }

    function updateData(datum) {
        console.log('chechkin...', datum);

            switch (datum.type) {
                case 'binary_switch':
                case 'binary_switches':
                    return handleBinaryswitch(datum);
                case 'light_bulb':
                case 'light_bulbs':
                    return handleLightbulb(datum);
                case 'powerstrip':
                case 'powerstrips':
                    return handleOutlets(datum);
                case 'icon':
                    return handleIcon(datum);
                default:
                    console.log('I dont know what this ' + datum.type + ' is...');
            }
    }

    source.addEventListener('message', function(msg){
        //$scope.$apply(function(){

        $scope.$apply(function() {
            var datum = JSON.parse(msg.data);
            updateData(datum);
            //console.log('', $scope.data);
        });

        //});
    }, false);
});