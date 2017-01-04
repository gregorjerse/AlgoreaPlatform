'use strict';

angular.module('algorea')
   .controller('navigationController', ['$rootScope', '$scope', 'itemService', 'pathService', '$state', '$filter', '$sce','$injector','$timeout', 'contestTimerService', '$http', function ($rootScope, $scope, itemService, pathService, $state, $filter, $sce, $injector, $timeout, contestTimerService, $http) {
      $scope.domainTitle = config.domains.current.title;
      $scope.config = config;
      $scope.viewsBaseUrl = $rootScope.templatesPrefix+'navigation/views/';
      var mapService = null;
      if (config.domains.current.useMap) {
         mapService = $injector.get('mapService');
      }
      $scope.getChildren = function() {
         return itemService.getChildren(this.item);
      };
      if (config.domains.current.additionalCssUrl) {
         $scope.additionalCssUrl = $sce.trustAsUrl(config.domains.current.additionalCssUrl);
      }
      if (config.domains.current.usesForum === false) {
         $scope.useForum = false;
      } else {
         $scope.useForum = true;
      }
      $scope.formValues = {};
      $scope.item = {ID: 0};
      $scope.errorItem = {ID: -1};
      this.firstApply = true;
      $scope.setItemOnMap = function() {
         if (this.item && config.domains.current.useMap) {
            mapService.setCurrentItem(this.item, this.pathParams);
         }
      }
      $scope.goToPath = function(path) {
         $state.go('contents', {path: path,sell:null,selr:null});
      }
      $scope.goToForum = function() {
         if (config.domains.current.ForumItemId) {
            $state.go('contents', {path: config.domains.current.ForumItemId,sell:null,selr:null});
         } else {
            $state.go('forum');
         }
      }
      $scope.getTemplate = function(from) {
         this.layout.isOnePage(false);
         var suffix = from ? '-'+from : '';
         $scope.itemType = this.item && this.item.sType ? itemService.normalizeItemType(this.item.sType) : 'error';
         var type = $scope.itemType.toLowerCase();
         // exception: DiscoverRootItemId has type Root but should be displayed as a Presentation
         if (this.item && this.item.ID == config.domains.current.DiscoverRootItemId && !from) {type = 'presentation';}
         if (this.item && this.item.ID == config.domains.current.ProgressRootItemId && !from) {type = 'progressroot';}
         if ( ! from) {
            if (type == 'chapter' || type == 'section' || type == 'level') {
               if (config.domains.current.useMap) {
                  type = 'blank';
               }
               this.layout.hasMap('always');
            } else if (type == 'task' || type == 'course') {
               this.layout.hasMap('button', this.firstApply);
            } else {
               this.layout.hasMap('never');
            }
            $scope.setItemOnMap();
            if (this.item.sFullScreen != 'forceNo' && (type == 'task' || type == 'course' || this.item.sFullScreen == 'forceYes')) {
               if (this.panel == 'right') { this.layout.rightIsFullScreen(true); }   
            } else {
               if (this.panel == 'right') { this.layout.rightIsFullScreen(false); }
            }
         }
         if (this.pathParams.currentItemID == -2 || (this.pathParams.sell == 0 && this.panel == 'left')) {
            type = 'blank';
            suffix = '';
         } else if (!this.item || this.item.ID == -1) {
            type = 'error';
         } else if (this.item.ID == 0) {
            type = 'loading';
         }
         this.firstApply = false;
         // haaaaaaack
         if (type+suffix == 'task' || type+suffix=='course' ||  type+suffix=='presentation') {
            return this.viewsBaseUrl+'taskcourse.html';
         }
         return this.viewsBaseUrl+type+suffix+'.html';
      };
      $scope.getSref = function(view) {
         return pathService.getSref(this.panel, this.depth, this.pathParams, this.relativePath, view);
      };
      $scope.goToResolution = function() {
         return pathService.goToResolution(this.pathParams);
      };
      // possible status: 'not visited', 'visited', 'validated', 'validated-ol' (in another language), 'failed', 'hintasked'
      $scope.item_status = function() {
         var user_item = itemService.getUserItem(this.item);
         if (this.item.bGrayedAccess && !this.item.sDuration) {
            return 'grayed';
         }
         if (!user_item || !user_item.sLastActivityDate || user_item.sLastActivityDate.getTime() == 0) {
            return 'not visited';
         }
         if (user_item.bValidated == true) {
            return 'validated';
         }
         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';
      };
      $scope.openContest = function() {
         var idItem = this.item.ID;
         var self = this;
         $http.post('contest/api.php', {action: 'openContest', idItem: idItem}, {responseType: 'json'}).success(function(res) {
            if (!res.success) {
               alert(res.error);
               return;
            }
            config.contestData = {endTime: res.endTime, startTime: res.startTime, duration: res.duration, idItem: idItem};
            contestTimerService.startContest(idItem, res.duration);
            var user_item = itemService.getUserItem(self.item);
            if (user_item) {user_item.sContestStartDate = new Date();}
            // for some reason, sync doesn't work in this case
            SyncQueue.sentVersion = 0;
            SyncQueue.serverVersion = 0;
            SyncQueue.resetSync = true;
            SyncQueue.planToSend(0);
         });
      };
      // TODO: cleanup
      var type_iconName = {
         'Root': 'list',
         'Task': 'keyboard',
         'Chapter': 'folder',
         'Course': 'assignment',
         'Presentation': 'speaker_notes',
         'Level': 'folder',
         'Section': 'folder',
      };
      $scope.setItemIcon = function (item) {
         var user_item = itemService.getUserItem(item);
         if (item.sType == 'Task') {
            if (!user_item) {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
               this.mainIconName = 'keyboard';
            } else if (user_item.bValidated) {
               this.mainIconTitle = 'validé le '+$scope.get_formatted_date(user_item.sValidationDate);
               this.mainIconClass = "validated-item-icon";
               this.mainIconName = 'check_circle';
            } else if (user_item.nbTasksTried) {
               this.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "failed-item-icon";
               this.mainIconName = 'cancel';
            } else if (user_item.sLastActivityDate) {
               this.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "visited-item-icon";
               this.mainIconName = 'keyboard';
            } else {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
               this.mainIconName = 'keyboard';
            }
         } else {
            this.mainIconName = type_iconName[itemService.normalizeItemType(item.sType)];
            if (user_item && user_item.bValidated) {
               this.mainIconTitle = 'validé le '+$scope.get_formatted_date(user_item.sValidationDate);
               this.mainIconClass = "validated-item-icon";
               this.mainIconName = 'check_circle';
            } else if (user_item && user_item.sLastActivityDate) {
               this.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "visited-item-icon";
            } else {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
            }
         }
      };
      $scope.setItemIcon($scope.item);

      $scope.setUserInfos = function() {
         $scope.userInfos = '';
         itemService.onNewLoad(function() {
            var loginData = SyncQueue.requests.loginData;
            if (loginData) {
               if (loginData.tempUser) {
                  $scope.userInfos = 'Non connecté';
                  return;
               }
               if (loginData.sFirstName && loginData.sLastName) {
                  $scope.userInfos = loginData.sFirstName+' '+loginData.sLastName;
               } else {
                  $scope.userInfos = loginData.sLogin;
               }
            }
         });   
      }
      $scope.$on('syncResetted', function() {
         $scope.setUserInfos();
      });
      $scope.setUserInfos();

      $scope.setShowUserInfos = function(item, pathParams) {
         this.showUserInfos = false;
         var that = this;
         if (!item) return;
         if (item.bShowUserInfos) {
            this.showUserInfos = true;
            return;
         }
         angular.forEach(pathParams.path, function(itemID, idx) {
            if (itemID == item.ID || idx >= pathParams.selr-1) {
               return false;
            }
            var ancestorItem = itemService.getRecord('items',itemID);
            if (ancestorItem && ancestorItem.bShowUserInfos) {
               that.showUserInfos = true;
            }
         });
      };

      $scope.item_percent_done = function(user_item) {
         if (!user_item) {
            return 0;
         }
         var children = itemService.getChildren(this.item);
         var total = 0;
         angular.forEach(children, function(child) {
            if (child.sType != 'Course' && child.bNoScore == 0) {
               total = total + 1;
            }
         });
         if (total == 0) {
            return 100;
         } else {
            return Math.floor(user_item.nbChildrenValidated / total);
         }
         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';
      };
      $scope.get_formatted_date = function(date) {
         return $filter('date')(date, 'fullDate');
      };
      $scope.selectItemItem = function(item, parentID) {
         var res = {};
         angular.forEach(item.parents, function(item_item) {
            if (item_item.idItemParent == parentID) {
               res = item_item;
            }
         });
         return res;
      };
      $scope.getItem = function(callback) {
         var that = this;
         itemService.getAsyncRecord('items', that.pathParams.currentItemID, function(item){
            if (!item) {
              that.item = that.errorItem;
              if (callback) {callback(null);}
              return;
            }
            that.item = item;
            that.parentItemID = item.ID;
            that.strings = itemService.getStrings(item);
            that.imageUrl = (that.strings && that.strings.sImageUrl) ? that.strings.sImageUrl : 'images/default-level.png';
            that.children = itemService.getChildren(item);
            that.user_item = itemService.getUserItem(item);
            if (!that.user_item) {
               console.error('cannot find user item for item '+item.ID);
               if(callback) {
                  callback(item);
               }
               return;
            }
            if (that.pathParams.parentItemID && that.pathParams.parentItemID != -2) {
               that.item_item = $scope.selectItemItem(item, that.pathParams.parentItemID);
            } else {
               that.item_item = {};
            }
            itemService.onSeen(item);
            that.setItemIcon(item);
            if (item.sType == 'Level') {
               that.levelLoading = true;
               itemService.syncDescendants(item.ID, function() {
                  that.levelLoading = false;
                  if (!that.user_item.sLastActivityDate && config.domains.current.useMap) {
                     mapService.updateSteps();
                  }
                  that.setShowUserInfos(item, that.pathParams);
                  if(callback) { callback(item); }
               });
            } else {
               if (!that.user_item.sLastActivityDate && config.domains.current.useMap) {
                  mapService.updateSteps();
               }
               that.setShowUserInfos(item, that.pathParams);
               if(callback) { callback(item); }
            }
         });
      };
      $scope.getTitle = function(item) {
         return item.strings[0].sTitle;
      };
}]);

angular.module('algorea')
   .controller('rightNavigationController', ['$scope', 'pathService', 'itemService', '$timeout', '$injector', function ($scope, pathService, itemService, $timeout, $injector) {
      var mapService = null;
      if (config.domains.current.useMap) {
         mapService = $injector.get('mapService');
      }
      $scope.panel = 'right';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('right');};
      $scope.setArrowLinks = function() {
         var brothers = itemService.getBrothersFromParent(this.pathParams.parentItemID);
         var nextID, previousID;
         for (var i = 0 ; i < brothers.length ; i++) {
            if ($scope.item && brothers[i].ID == $scope.item.ID) {
               nextID = (i+1<brothers.length) ? brothers[i+1].ID : null;
               break;
            }
            previousID = brothers[i].ID;
         }
         var basePath = $scope.pathParams.path.slice(0, $scope.pathParams.selr-1).join('/');
         if (nextID) {
            $scope.rightLink = {sref: pathService.getSrefFunction(basePath+'/'+nextID, null, null, null), stateName: 'contents', stateParams: {path: basePath+'/'+nextID, selr: null, viewr: null}};
         } else {
            $scope.rightLink = null;
            if ($scope.pathParams.selr > 4) {
               var grandParentId = $scope.pathParams.path[$scope.pathParams.selr-3];
               if (grandParentId) {
                  var uncles = itemService.getBrothersFromParent(grandParentId);
                  var grandParentPath = $scope.pathParams.path.slice(0, $scope.pathParams.selr-2).join('/');
                  for (i = 0 ; i < uncles.length ; i++) {
                     if (uncles[i].ID == this.pathParams.parentItemID) {
                        nextID = (i+1<uncles.length) ? uncles[i+1].ID : null;
                        break;
                     }
                  }
                  if (nextID) {
                     $scope.rightLink = {sref: pathService.getSrefFunction(grandParentPath+'/'+nextID, $scope.pathParams.path.length-2, null, null, null), stateName: 'contents', stateParams: {path: basePath, sell: $scope.pathParams.path.length-2, selr: null, viewr: null}};
                  }
               }
            }
         }
         if (previousID) {
            $scope.leftLink = {sref: pathService.getSrefFunction(basePath+'/'+previousID, null, null, null), stateName: 'contents', stateParams: {path: basePath+'/'+previousID, selr: null, viewr: null}};
         } else {
            $scope.leftLink = null;
            if(basePath) {
               $scope.leftLink = {sref: pathService.getSrefFunction(basePath, $scope.pathParams.path.length-1, null, null, null), stateName: 'contents', stateParams: {path: basePath, sell: $scope.pathParams.path.length-1, selr: null, viewr: null}};
            }
         }
         // setting map link. Some additional logic could be added here
         if (this.pathParams.parentItemID > 0) {// for some forgotten logic, value is -2 when there is no parent item
            $scope.hasMap = true;
         } else {
            $scope.hasMap = false;
         }
      }
      $scope.goLeftLink = function() {
         if ($scope.leftLink) {
            $scope.leftLink.sref();
         }
      };
      $scope.goRightLink = function() {
         if ($scope.rightLink) {
            $scope.rightLink.sref();
         }
      };

      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.firstApply = true;
         $scope.item = {ID: 0};
         $scope.getItem(function() {
            $scope.setArrowLinks();
            $scope.setItemOnMap();
            if (config.domains.current.useMap) {
               mapService.updateSteps();
            }
         });
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
      $scope.$on('algorea.reloadView', function(event, viewName){
         if (viewName == 'right') {
            $scope.getPathParams();
            $scope.setArrowLinks();
            $scope.setItemOnMap();
         }
      });
}]);

angular.module('algorea')
   .controller('leftNavigationController', ['$scope', 'pathService', 'itemService', '$rootScope', function ($scope, pathService, itemService, $rootScope) {
      $scope.panel = 'left';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('left');}
      $scope.itemsList = [];
      $scope.layout.hasLeftMenu(false);
      function getLeftItems(item) {
         if (!item) {
            $scope.layout.hasLeftMenu(false);
            return;
         } else {
            $scope.layout.hasLeftMenu(true);
         }
         $scope.leftParentItemId = item.ID;
         $scope.itemsList = [];
         if (item.sType == 'Presentation') {
            $scope.itemsList = [item];
            return;
         }
         var children = itemService.getChildren(item);
         angular.forEach(children, function(child) {
            child.private_sref = pathService.getSref($scope.panel, 1, $scope.pathParams, '/'+child.ID);
            child.private_go = pathService.getStateGo($scope.panel, 1, $scope.pathParams, '/'+child.ID);
            $scope.itemsList.push(child);
         });
         $scope.currentActiveId = $scope.pathParams.path[$scope.pathParams.selr-1];
         var strings = itemService.getStrings(item);
         if (!strings) {
            console.error('no string for item'+item.ID);
            $scope.currentLeftItemTitle = '';
         } else {
            $scope.currentLeftItemTitle = strings.sTitle;
         }
      };
      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.item = {ID: 0};
         $scope.getItem(getLeftItems);
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
      $scope.$on('algorea.reloadView', function(event, viewName){
         if (viewName == 'right') {
            $scope.getPathParams();
            $scope.currentActiveId = $scope.pathParams.path[$scope.pathParams.selr-1];
         }
      });
}]);

angular.module('algorea')
   .controller('leftNavItemController', ['$scope', 'pathService', 'itemService', function ($scope, pathService, itemService) {
   function init() {
      var item = $scope.item;
      $scope.item_item = $scope.selectItemItem(item, $scope.leftParentItemId);
      var user_item = itemService.getUserItem(item);
      $scope.setItemIcon(item);
      if (item.ID == $scope.currentActiveId) {
         $scope.mainIconClass = "active-item-icon";
         $scope.linkClass = "active-item-link";
         $scope.backgroundClass = "active-item-background";
      } else {
         $scope.backgroundClass = "inactive-item-background";
         if (user_item && user_item.sLastActivityDate) {
            $scope.linkClass = "visited-item-link";
         } else {
            $scope.linkClass = "unvisited-item-link";
         }
      }
      $scope.$applyAsync();
   }
   init();
   $scope.$on('algorea.reloadView', function(event, viewName){
      if (viewName == 'right') {
         init();
      }
   });
   $scope.$on('algorea.itemTriggered', function(event, itemId){
      if (itemId == $scope.item.ID) {
         init();
      }
   });
}]);

angular.module('algorea')
   .controller('superBreadCrumbsController', ['$scope', 'itemService', 'pathService', function ($scope, itemService, pathService) {
      $scope.panel = 'menu';
      $scope.getItems = function() {
         var indexShift = 0;
         angular.forEach($scope.pathParams.path, function(ID, index) {
            if (ID == config.domains.current.CustomProgressItemId || ID == config.domains.current.OfficialProgressItemId) {
               indexShift = indexShift + 1;
               return;
            }
            var newIndex = index - indexShift;
            $scope.items.push({ID: 0});
            itemService.getAsyncRecord('items', ID, function(item) {
               $scope.items[newIndex] = item;
               if (item) {
                  item.breadCrumbsDepth = index;
               }
            });
         });
      };
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('menu');}
      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.items = [];
         $scope.getItems();
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
}]);

angular.module('algorea')
   .controller('navbarController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
      $scope.siteTitle = config.domains.current.title;
      $scope.tagline = config.domains.current.taglineHtml;
      $scope.gotoMenuItem = function(i, tabPath) {
         $scope.activated = i;
         if (tabPath == 'forum'){
            $state.go('forum');
         } else {
            if (tabPath.indexOf('/') !== -1) {
               $state.go('contents', {path: tabPath,sell:1,selr:2});
            } else {
               $state.go('contents', {path: tabPath,sell:0,selr:1});
            } 
         }
      };
      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
         $scope.activated = null;
         var toSearch = toState.name;
         if (toState.name == 'thread' || toState.name == 'newThread') {
            toSearch = 'forum';
         } else if (toState.name == 'contents') {
            toSearch = toParams.path
         }
         angular.forEach(config.domains.current.tabs, function(tab, i) {
            if (toSearch.indexOf(tab.path) !== -1) {
               $scope.activated = i;
            }
         });
      });
}]);
