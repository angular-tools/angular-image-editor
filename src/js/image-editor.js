(function () {
    'use strict';

    var uploaderURL = '/generic/uploader';

    angular.module('imageEditor', ['ngDialog', 'angular-img-cropper'])
        .factory('$imageEditor', ['$http', 'ngDialog', '$timeout', '$notice', '$q', function ($http, $dialog, $timeout, $notice, $q) {
            var imageEditor = {};

            imageEditor.show = function (imgURL, maxWidth, maxHeight, freeAspect, cb) {
                $dialog.open({
                    template: '/static/bower_components/angular-image-editor/src/templates/image-editor.html',
                    className: 'ngdialog-theme-plain custom-width',
                    controller: ['$scope', '$timeout', function ($scope, $timeout) {
                        var rotating = false;

                        $timeout(function () {
                            $scope.pWidth = $('#imageCropDialog').width();
                            $scope.pHeight = maxHeight * Math.min(1, $('#imageCropDialog').width() / maxWidth);
                        }, 500);

                        $scope.cropper = {};

                        $scope.init = function () {
                            $scope.pWidth = maxWidth;
                            $scope.pHeight = maxHeight;
                            $scope.cropper.sourceImage = imgURL;
                            $scope.cropper.croppedImage = null;
                        };

                        $scope.rotate = function (deg) {
                            if (!rotating) {
                                rotating = true;

                                var canvas = document.getElementById('rc');
                                var ctx = canvas.getContext('2d');
                                var img = new Image();
                                var imgCopy = document.getElementById('imgCopy');
                                img.crossOrigin = "Anonymous";
                                img.src = imgCopy.src || $scope.cropper.sourceImage;

                                img.onload = function () {
                                    canvas.width = img.height || 320;
                                    canvas.height = img.width || 240;

                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                    ctx.translate(img.height / 2, img.width / 2);
                                    ctx.rotate(deg * Math.PI / 180);
                                    ctx.drawImage(img, -img.width / 2, -img.height / 2);

                                    imgCopy.src = canvas.toDataURL("image/png");
                                    $timeout(function () {
                                        $scope.cropper.sourceImage = imgCopy.src;
                                        rotating = false;
                                    });
                                };
                            }
                        };

                        $scope.save = function () {
                            $scope.saving = true;

                            var imgData = $scope.cropper.croppedImage.split(',', 2);
                            var promise = $http.post(uploaderURL, {data: imgData[1], file: imgURL.split('\\').pop().split('/').pop(), base64: true});
                            promise.then($scope.uploadDone, $scope.uploadDone);
                        };

                        $scope.uploadDone = function (result) {
                            if ($scope.saving) {
                                $scope.saving = false;

                                if (result && result.data && result.data.url) {
                                    if (cb instanceof Function) {
                                        cb(result.data.url);
                                    }
                                } else {
                                    $notice.error('Sorry the image could not be updated');
                                }

                                $scope.closeThisDialog();
                            }
                        };

                        $scope.abort = function () {
                            $scope.saving = false;
                            $scope.closeThisDialog();
                        };

                        $scope.init();
                    }]
                });
            };

            return imageEditor;
        }]);
})();
