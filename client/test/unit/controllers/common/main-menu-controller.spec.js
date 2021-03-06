'use strict';

describe('Controllers/Common: MainMenuController', function () {
    var test;

    beforeEach(module('appControllers.common'));

    beforeEach(function () {
        test = this;

        var beforeInjects = [],

            data = {
                'config': {
                    'app_name': 'storekeeper_test',
                    'app_title': 'StoreKeeperTest',
                    'debug': false,
                    'forced_language': null
                },
                'configWithForcedLanguage': {
                    'app_name': 'storekeeper_test',
                    'app_title': 'StoreKeeperTest',
                    'debug': false,
                    'forced_language': 'hu'
                }
            },

            mocks = {
                '$aside': {},
                'gettextCatalog': {
                    'currentLanguage': 'hu',
                    'setCurrentLanguage': function () {}
                },
                'ConfigFactory': {
                    'getConfig': function () {
                        return helper.promiseMock(test, 'configResolved', test.config, test.config);
                    }
                },
                'CommonFactory': {
                    'showResponseError': function () {}
                }
            },

            dependencies = {
                '$aside': mocks.$aside,
                'gettextCatalog': mocks.gettextCatalog,
                'ConfigFactory': mocks.ConfigFactory,
                'CommonFactory': mocks.CommonFactory
            },

            injectController = function () {
                spyOn(mocks.CommonFactory, 'showResponseError').and.stub();
                spyOn(mocks.gettextCatalog, 'setCurrentLanguage').and.stub();

                beforeInjects.forEach(function (beforeInject) {
                    beforeInject();
                });

                inject(function ($controller, $rootScope, $q) {
                    test.$rootScope = $rootScope;
                    test.$scope = $rootScope.$new();
                    test.$q = $q;

                    dependencies.$scope = test.$scope;

                    $controller('MainMenuController', dependencies);
                });

                test.$rootScope.$apply();
            };

        this.beforeInjects = beforeInjects;
        this.data = data;
        this.mocks = mocks;
        this.injectController = injectController;
    });

    beforeEach(function () {
        this.beforeInjects.push(function () {
            test.config = test.data.config;
            test.configResolved = true;
        });
    });

    describe('config', function () {
        beforeEach(function () {
            this.beforeInjects.push(function () {
                test.configResolved = false;
            });
        });

        it('drop error when can not load config', function () {
            test.injectController();

            expect(test.mocks.CommonFactory.showResponseError).toHaveBeenCalledWith(test.data.config);
        });
    });

    describe('language', function () {

        describe('without forced language', function () {

            it('get list of available languages', function () {
                test.injectController();

                expect(test.$scope.languages).toBeDefined();

                expect(test.$scope.languages.length).toBeGreaterThan(0);
            });

            it('get current language', function () {
                test.injectController();

                expect(test.$scope.getCurrentLanguage).toBeDefined();

                expect(test.$scope.getCurrentLanguage()).toBe('hu');
            });

            it('set language', function () {
                test.injectController();

                expect(test.$scope.changeLanguage).toBeDefined();

                test.$scope.changeLanguage('en');
                expect(test.mocks.gettextCatalog.setCurrentLanguage).toHaveBeenCalledWith('en');
            });
        });

        describe('with forced language', function () {

            beforeEach(function () {
                this.beforeInjects.push(function () {
                    test.config = test.data.configWithForcedLanguage;
                });
            });

            it('can not available any language related element', function () {
                test.injectController();

                expect(test.$scope.languages).not.toBeDefined();
                expect(test.$scope.getCurrentLanguage).not.toBeDefined();
                expect(test.$scope.changeLanguage).not.toBeDefined();
            });
        });
    });
});
