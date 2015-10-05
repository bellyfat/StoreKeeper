'use strict';

var appItemSidebarControllers = angular.module('appControllers.sidebar.item', []);


appItemSidebarControllers.controller('ItemSidebarController', ['$scope', '$log', '$window', '$modal', 'gettextCatalog', 'Restangular', 'CommonFactory', 'BarcodeCacheFactory', 'ItemCacheFactory', 'PersistFactory',
    function ItemSidebarController ($scope, $log, $window, $modal, gettextCatalog, Restangular, CommonFactory, BarcodeCacheFactory, ItemCacheFactory, PersistFactory) {
        var
            /**
             * Persistent storage
             *
             * It can load and save settings of this controller
             */
            persistentStorageClass = function persistentStorageClass () {
                var storage = PersistFactory.load('sidebar_item', 1),
                    data = storage.data;

                if (!data.readElements) {
                    data.readElements = [];
                }

                if (!data.uiSettings) {
                    data.uiSettings = {};
                }

                return {
                    'data': data,
                    'save': storage.save
                };
            },

            /**
             * Persistable element storage
             *
             * Element structure:
             * {
             *   'item': <Item by ItemService>,
             *   'data': <reference of persisted 'barcode', 'barcodeQuantity', 'itemId', 'count' contained object>
             * }
             */
            readElementsClass = function readElementsClass (elementStorage, barcodeCache, itemCache) {
                var elements = [],

                fetchItemStorage = function fetchItemStorage () {
                    var length = elementStorage.length,
                        index,
                        element;

                    for (index = 0; index < length; index += 1) {
                        element = elementStorage.shift();
                        if (element.itemId) {
                            addElement(element.barcode, element.itemId, element.count);
                        } else {
                            addNewElement(element.barcode, element.count);
                        }
                    }
                },

                addElement = function addElement (barcodeValue, itemId, count) {
                    var element = pushElementData({
                            'barcode': barcodeValue,
                            'itemId': itemId,
                            'count': count || 1
                        });

                    barcodeCache.getBarcode(barcodeValue).then(function (barcode) {
                        element.barcode = barcode;
                    });

                    itemCache.getItemById(itemId).then(function (item) {
                        element.item = item;
                    });
                },

                addNewElement = function addNewElement (barcodeValue, count) {
                    pushElementData({
                        'barcode': barcodeValue.toUpperCase(),
                        'itemId': null,
                        'count': count || 1
                    });
                },

                pushElementData = function pushElementData (elementData) {
                    var element = {
                        'barcode': null,
                        'item': null,
                        'data': elementData
                    };

                    elementStorage.push(elementData);
                    elements.push(element);

                    return element;
                },

                removeElement = function removeElement (elementIndex) {
                    elementStorage.splice(elementIndex, 1);
                    elements.splice(elementIndex, 1);
                },

                removeAllElements = function removeAllElements () {
                    elementStorage.splice(0, elementStorage.length);
                    elements.splice(0, elements.length);
                },

                getIndexByBarcode = function getIndexByBarcode (barcode) {
                    return _.findIndex(elements, function (element) {
                        return element.data.barcode === barcode;
                    });
                };

                fetchItemStorage();

                return {
                    'elements': elements,
                    'addElement': addElement,
                    'addNewElement': addNewElement,
                    'removeElement': removeElement,
                    'removeAllElements': removeAllElements,
                    'getIndexByBarcode': getIndexByBarcode
                };
            },

            /**
             * Class instances
             */
            barcodeCache = new BarcodeCacheFactory('itemSidebarLoadingBarcodes'),
            itemCache = new ItemCacheFactory('itemSidebarLoadingBarcodeItem'),
            persistentStorage = persistentStorageClass(),
            readElements = readElementsClass(persistentStorage.data.readElements, barcodeCache, itemCache),

            /**
             * UI helper functions
             */
            enterElement = function enterElement () {
                var barcode = $scope.searchField;
                if (angular.isObject($scope.searchField)) {
                    barcode = getBarcodeFromObject($scope.searchField);
                }
                barcodeCache.getBarcode(barcode).then(
                    handleExistingBarcode,
                    handleNewBarcode
                );
                $scope.searchField = '';
            },

            addNewElement = function addNewElement () {},

            getBarcodeFromObject = function getBarcodeFromObject (selectedObject) {
                if (selectedObject.type === 'barcode') {
                    return selectedObject.barcode;
                } else if (selectedObject.type === 'item') {
                    return selectedObject.master_barcode;
                }
                $log.error('Unknown object type', selectedObject.type);
            },

            handleExistingBarcode = function handleExistingBarcode (barcode) {
                var index = readElements.getIndexByBarcode(barcode.barcode);
                if (index >= 0) {
                    readElements.elements[index].data.count += 1;
                } else {
                    readElements.addElement(barcode.barcode, barcode.item_id);
                }
                persistentStorage.save();
            },

            handleNewBarcode = function handleNewBarcode (barcodeValue) {
                var index = readElements.getIndexByBarcode(barcodeValue);
                if (index >= 0) {
                    readElements.elements[index].data.count += 1;
                } else {
                    readElements.addNewElement(barcodeValue);
                }
                persistentStorage.save();
            },

            addBarcodeToANewItem = function addBarcodeToANewItem ($index, readElement) {},

            assignBarcodeToAnExistingItem = function assignBarcodeToAnExistingItem ($index, readElement) {
                var scope = $scope.$new(),
                    modal;

                scope.defaultButtonTitle = gettextCatalog.getString('Assign to item');
                scope.data = {
                    'selectedItem': ''
                };
                scope.onItemSelect = function onItemSelect (selectedItem) {
                    var
                        barcode = {
                            'barcode': readElement.data.barcode
                        };

                    itemCache.getItemById(selectedItem.item_id).then(
                        function (item) {
                            CommonFactory.handlePromise(item.all('barcodes').post(Restangular.copy(barcode)),
                                'itemSelectorOperation',
                                function (resp) {
                                    readElement.data.itemId = selectedItem.item_id;
                                    persistentStorage.save();

                                    readElement.barcode = resp;
                                    itemCache.getItemById(selectedItem.item_id).then(
                                        function (item) {
                                            readElement.item = item;
                                        }
                                    );

                                    modal.$promise.then(function () {
                                        modal.hide();
                                        scope.$destroy();
                                    });
                                });
                        });
                };

                modal = $modal({
                    'templateUrl': 'partials/views/item-selector.html',
                    'scope': scope,
                    'show': true
                });
            },

            printElement = function printElement ($index, readElement) {
                itemCache.getItemById(readElement.data.itemId).then(
                    function (item) {
                        CommonFactory.handlePromise(
                            item.one('barcodes', readElement.barcode.id).customPUT(null, 'print'),
                            'itemSidebarPrintingBarcode'
                        );
                    });
            },

            removeElement = function removeElement (elementIndex) {
                var readElement = readElements.elements[elementIndex],
                    message;

                if (readElement.data.itemId) {
                    message = gettextCatalog.getString(
                        'Do you want to delete barcode "{{ barcode }}" ({{ count }} x {{ quantity }} {{ unit }} of "{{ name }}")', {
                            'barcode': readElement.data.barcode,
                            'count': readElement.data.count,
                            'quantity': readElement.data.quantity,
                            'unit': readElement.item.unit.unit,
                            'name': readElement.item.name
                        });
                } else {
                    message = gettextCatalog.getString(
                        'Do you want to delete barcode "{{ barcode }}" ({{ count }} pcs)', {
                            'barcode': readElement.data.barcode,
                            'count': readElement.data.count
                        });
                }

                if ($window.confirm(message)) {
                    readElements.removeElement(elementIndex);
                    persistentStorage.save();
                }
            },

            printAllElements = function printAllElements () {
                var count = getCountOfPrintableLabels(),
                    message = gettextCatalog.getString('Do you want to print sum ' + count + ' pcs. labels?');

                if (!$window.confirm(message)) {
                    return;
                }

                _.forEach(readElements.elements, function (readElement) {
                    if (!readElement.barcode) {
                        return;
                    }
                    itemCache.getItemById(readElement.data.itemId).then(
                        function (item) {
                            CommonFactory.handlePromise(
                                item.one('barcodes', readElement.barcode.id).customPUT({'copies': readElement.data.count}, 'print'),
                                'itemSidebarPrintingBarcode'
                            );
                        });
                });
            },

            getCountOfPrintableLabels = function getCountOfPrintableLabels () {
                var length = readElements.elements.length,
                    readElement,
                    index,
                    count = 0;

                for (index = 0; index < length; index += 1) {
                    readElement = readElements.elements[index];
                    if (readElement.barcode) {
                        count += readElement.data.count;
                    }
                }

                return count;
            },

            removeAllElements = function removeAllElements () {
                var message = gettextCatalog.getString('Do you want to clear list?');
                if ($window.confirm(message)) {
                    readElements.removeAllElements();
                    persistentStorage.save();
                }
            },

            moveElementsToCurrentView = function moveElementsToCurrentView () {};


        $scope.enterNewBarcode = function enterNewBarcode () {};


        $scope.readElements = readElements.elements;
        $scope.uiSettings = persistentStorage.data.uiSettings;
        $scope.save = persistentStorage.save;

        $scope.searchField = '';
        $scope.enterElement = enterElement;
        $scope.addNewElement = addNewElement;

        $scope.addBarcodeToANewItem = addBarcodeToANewItem;
        $scope.assignBarcodeToAnExistingItem = assignBarcodeToAnExistingItem;
        $scope.printElement = printElement;
        $scope.removeElement = removeElement;

        $scope.printAllElements = printAllElements;
        $scope.removeAllElements = removeAllElements;
        $scope.moveElementsToCurrentView = moveElementsToCurrentView;
    }]);