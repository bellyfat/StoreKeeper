'use strict';

describe('Controllers/Views: ItemsController', function () {
    var test;

    beforeEach(module('appControllers.views'));

    beforeEach(function () {
        test = this;

        var data = {
                'items': [
                    {
                        'id': 123
                    },
                    {
                        'id': 456
                    }
                ],
                'itemModal': {
                    '$id': 'item'
                },
                'otherModal': {
                    '$id': 'foo'
                }
            },

            mocks = {
                '$scope': {
                    '$on': function (name, func) {
                        test.eventListeners[name] = func;
                    },
                    '$new': function () {
                        return test.newScope;
                    }
                },
                '$event': {
                    'preventDefault': function () {}
                },
                '$location': {
                    'search': function () {
                        return test.locationSearch;
                    }
                },
                '$modal': function (modal) {
                    test.openedModals.push(modal);
                },
                '_': {
                    'findIndex': function () {
                        return test.filterResult;
                    }
                },
                'ItemService': {
                    'getList': function () {
                        return helper.promiseMock(test, 'getListResolved', data.items);
                    }
                },
                'CommonFactory': {
                    'handlePromise': function (promise, spinner, resolve, reject) {
                        return promise.then(resolve, reject);
                    }
                }
            },

            dependencies = {
                '$scope': mocks.$scope,
                '$location': mocks.$location,
                '_': mocks._.findIndex,
                '$modal': mocks.$modal,
                'ItemService': mocks.ItemService,
                'CommonFactory': mocks.CommonFactory
            },

            injectController = function () {
                spyOn(test.mocks.ItemService, 'getList').and.callThrough();
                spyOn(test.mocks._, 'findIndex').and.callThrough();
                spyOn(test.mocks.$scope, '$new').and.callThrough();
                spyOn(test.mocks.$location, 'search').and.callThrough();
                spyOn(test.mocks.$event, 'preventDefault').and.stub();

                inject(function ($controller, $rootScope, $q) {
                    test.$rootScope = $rootScope;
                    test.$q = $q;

                    $controller('ItemsController', dependencies);
                });
            };

        this.data = data;
        this.mocks = mocks;
        this.injectController = injectController;
    });

    beforeEach(function () {
        test.getListResolved = true;
        test.newScope = {};
        test.openedModals = [];
        test.locationSearch = {};
        test.eventListeners = {};
        test.filterResult = -1;
    });

    it('can get items from server side', function () {
        test.injectController();
        expect(test.mocks.$scope.items).not.toBeDefined();

        test.$rootScope.$apply();

        expect(test.mocks.ItemService.getList).toHaveBeenCalled();
        expect(test.mocks.$scope.items).toEqual(test.data.items);
    });

    it('handle server side errors', function () {
        test.getListResolved = false;
        test.injectController();
        expect(test.mocks.$scope.items).not.toBeDefined();

        test.$rootScope.$apply();

        expect(test.mocks.ItemService.getList).toHaveBeenCalled();
        expect(test.mocks.$scope.items).not.toBeDefined();
    });

    //describe('open Item modal', function () {
    //    describe('via openItem()', function () {
    //        it('set rowData', function () {
    //            test.injectController();
    //            test.$rootScope.$apply();
    //
    //            test.mocks.$scope.openItem(test.data.items[0]);
    //            expect(test.mocks.$scope.$new).toHaveBeenCalled();
    //            expect(test.newScope.rowData).toBe(test.data.items[0]);
    //        });
    //
    //        it('is opened modal', function () {
    //            expect(test.openedModals.length).toEqual(0);
    //
    //            test.injectController();
    //            test.$rootScope.$apply();
    //
    //            test.mocks.$scope.openItem(test.data.items[0]);
    //            expect(test.openedModals.length).toEqual(1);
    //            expect(test.openedModals[0].id).toEqual('item');
    //        });
    //    });
    //
    //    it('via location search', function () {
    //        expect(test.openedModals.length).toEqual(0);
    //
    //        test.filterResult = 1;
    //        test.locationSearch.id = test.data.items[test.filterResult].id;
    //        test.injectController();
    //        test.$rootScope.$apply();
    //
    //        expect(test.openedModals.length).toEqual(1);
    //        expect(test.openedModals[0].id).toEqual('item');
    //    });
    //});

    //describe('modal state in url', function () {
    //    it('open modal set id in location search', function () {
    //        test.injectController();
    //        test.$rootScope.$apply();
    //
    //        test.mocks.$scope.openItem(test.data.items[0]);
    //        expect(test.mocks.$location.search).toHaveBeenCalledWith('id', 123);
    //    });
    //
    //    it('close an Item modal clear id in location search', function () {
    //        test.injectController();
    //        test.$rootScope.$apply();
    //
    //        test.eventListeners['modal.hide'](test.mocks.$event, test.data.itemModal);
    //        expect(test.mocks.$location.search).toHaveBeenCalledWith('id', null);
    //    });
    //
    //    it('close a non Item modal does not do anything with location search', function () {
    //        test.injectController();
    //        test.$rootScope.$apply();
    //        test.mocks.$location.search.calls.reset();
    //
    //        test.eventListeners['modal.hide'](test.mocks.$event, test.data.otherModal);
    //        expect(test.mocks.$location.search).not.toHaveBeenCalled();
    //    });
    //});
});
