<!DOCTYPE html>
<html lang="fr" ng-app="algorea"  ng-controller="navigationController">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title ng-bind="domainTitle"></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximal-scale=1.0, user-scalable=no, minimal-scale=1.0">
    <base href="/">
    <script type="text/javascript">
      <?php
        require_once "config.php";
        $assetsBaseUrl = '';
        $urlArgs = '';
        $compiledMode = false;
        $additionalCssUrl = null;
        $animationHtmlFile = null;
        $useMap = false;
        $usesForum = false;
        $domainConfig = $config->shared->domains['current'];
        if (property_exists($domainConfig, 'compiledMode')) {
          $compiledMode = $domainConfig->compiledMode;
        }
        if (property_exists($domainConfig, 'assetsBaseUrl')) {
          $assetsBaseUrl = $domainConfig->assetsBaseUrl;
        }
        if (property_exists($domainConfig, 'urlArgs')) {
          $urlArgs = $domainConfig->urlArgs;
        }
        if (property_exists($domainConfig, 'additionalCssUrl')) {
          $additionalCssUrl = $domainConfig->additionalCssUrl;
        }
        if (property_exists($domainConfig, 'animationHtmlFile')) {
          $animationHtmlFile = $domainConfig->animationHtmlFile;
        }
        if (property_exists($domainConfig, 'useMap')) {
          $useMap = $domainConfig->useMap;
        }
        if (property_exists($domainConfig, 'usesForum')) {
          $usesForum = $domainConfig->usesForum;
        }
        function includeFile($url) {
          global $assetsBaseUrl, $urlArgs;
          return $assetsBaseUrl.$url.$urlArgs;
        }
        echo 'var config = '.json_encode($config->shared).';';
      ?>
    </script>
    <?php if (!$compiledMode): ?>
      <link rel="stylesheet" href="<?= includeFile('bower_components/bootstrap/dist/css/bootstrap.min.css') ?>">
      <link href="<?= includeFile('layout/3columns-flex.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/menu.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/main.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/sidebar-left.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('layout/sidebar-right.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('groupAdmin/groupAdmin.css') ?>" rel="stylesheet" type="text/css" />
      <link href="<?= includeFile('groupRequests/groupRequests.css') ?>" rel="stylesheet" type="text/css" />
      <link rel="stylesheet" href="<?= includeFile('algorea.css') ?>" type="text/css">
      <?php if ($usesForum): ?>
        <link href="<?= includeFile('bower_components/dynatree/dist/skin/ui.dynatree.css') ?>" rel="stylesheet" type="text/css">
        <link rel="stylesheet" href="<?= includeFile('forum/forum.css') ?>" type="text/css">
      <?php endif; ?>
    <?php else: ?>
      <link rel="stylesheet" href="<?= includeFile('vendor.min.css') ?>">
      <link rel="stylesheet" href="<?= includeFile('algorea.min.css') ?>">
    <?php endif; ?>
    <?php if ($additionalCssUrl): ?>
      <link rel="stylesheet" href="<?= $additionalCssUrl.$urlArgs ?>" type="text/css">
    <?php endif; ?>
    <link href='//fonts.googleapis.com/css?family=Roboto+Condensed:400,700' rel='stylesheet' type='text/css'>
    <link href='//fonts.googleapis.com/css?family=Roboto:300,700' rel='stylesheet' type='text/css'>
    <link href="//fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
    #animation-debut {
      position:absolute;
      top:0px;
      left:0px;
      width:100%;
      height:100%;
      z-index:99;
      opacity:1;
      border:0px;
      transition: opacity 0.5s ease-in-out;
      overflow:hidden;
    }
    .animation-debut-fade {
      opacity:0 !important;
      z-index:-99 !important;
    }
    [ng\:cloak], [ng-cloak], [data-ng-cloak], [x-ng-cloak], .ng-cloak, .x-ng-cloak {
      display: none !important;
    }
    </style>
</head>
<body ng-controller="layoutController" id="body" ng-cloak>
<?php if ($animationHtmlFile): ?>
  <iframe id="animation-debut" src="<?= $animationHtmlFile ?>" onclick="animationFinished()" style="display:none;"></iframe>
<?php endif; ?>
<div id="fixed-header-room" class="fixed-header-room"></div>
<header ng-click="layout.menuClicked($event);" ng-include="templatesPrefix+'menu.html'">
</header>
<div id='main'>

<nav ui-view="left" autoscroll="false" id="sidebar-left" class="sidebar-left" ng-hide="layout.isMenuClosed()"></nav>

<article id="view-right" ui-view="right" autoscroll="false" ng-click="layout.closeIfOpen();"></article>

</div>

<footer id="footer" ng-include="templatesPrefix+'footer.html'"></footer>

<?php if ($useMap): ?>
  <div id="map" class="map" style="display:none;" ng-include="templatesPrefix+'map/map.html'"></div>
<?php endif; ?>

<script>
function animationFinished() {
  $('#animation-debut').addClass('animation-debut-fade');
  window.setTimeout(function() {
    $('#animation-debut').remove();
  }, 2000);
  document.getElementById('body').style['overflow-x']='auto';
  document.getElementById('body').style['overflow-y']='scroll';
}
function startAnimation() {
  document.getElementById('animation-debut').src=config.domains.current.animationHtmlFile;
  document.getElementById('animation-debut').style.display='block';
  document.getElementById('body').style['overflow-x']='hidden';
  document.getElementById('body').style['overflow-y']='hidden';
}
if (location.pathname=='/' && config.domains.current.animationHtmlFile) startAnimation();
</script>
<?php if (!$compiledMode): ?>
  <script src="<?= includeFile('bower_components/jquery/dist/jquery.min.js') ?>"></script>
  <?php if ($usesForum): ?>
    <script src="<?= includeFile('bower_components/jquery-ui/jquery-ui.min.js') ?>"></script>
    <script src="<?= includeFile('bower_components/dynatree/dist/jquery.dynatree.min.js') ?>" type="text/javascript"></script>
    <script src="<?= includeFile('shared/utils.js') ?>"></script>
    <script src="<?= includeFile('ext/inheritance.js') ?>" type="text/javascript"></script>
    <script src="<?= includeFile('commonFramework/treeview/treeview.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('bower_components/angular/angular.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-i18n/angular-locale_fr-fr.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-sanitize/angular-sanitize.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js') ?>"></script>
  <script src="<?= includeFile('bower_components/angular-ui-router/release/angular-ui-router.min.js') ?>"></script>
  <script src="<?= includeFile('commonFramework/modelsManager/modelsManager.js') ?>"></script>
  <script src="<?= includeFile('commonFramework/sync/syncQueue.js') ?>"></script>
  <script src="<?= includeFile('shared/models.js') ?>"></script>
  <script src="<?= includeFile('shared/small-ui-confirm.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('bower_components/angu-fixed-header-table/angu-fixed-header-table.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('bower_components/lodash/dist/lodash.min.js') ?>" type="text/javascript"></script>
  <script src="<?= includeFile('login/service.js') ?>"></script>
  <script src="<?= includeFile('algorea.js') ?>"></script>
  <script src="<?= includeFile('contest/contestTimerService.js') ?>"></script>
  <script src="<?= includeFile('contest/contestTimerDirective.js') ?>"></script>
  <script src="<?= includeFile('layout.js') ?>"></script>
  <script src="<?= includeFile('navigation/service.js') ?>"></script>
  <script src="<?= includeFile('navigation/controllers.js') ?>"></script>
  <script src="<?= includeFile('navigation/directives.js') ?>"></script>
  <script src="<?= includeFile('community/controller.js') ?>"></script>
  <?php if ($useMap): ?>
    <script src="<?= includeFile('bower_components/paper/dist/paper-full.min.js') ?>"></script>
    <script src="<?= includeFile('bower_components/jquery-mousewheel/jquery.mousewheel.min.js') ?>"></script>
    <script src="<?= includeFile('map/mapService.js') ?>"></script>
    <script src="<?= includeFile('map/map.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('bower_components/jschannel/src/jschannel.js') ?>"></script>
  <script src="<?= includeFile('bower_components/pem-platform/task-xd-pr.js') ?>"></script>
  <script src="<?= includeFile('login/controller.js') ?>"></script>
  <script src="<?= includeFile('states.js') ?>"></script>
  <script src="<?= includeFile('task/controller.js') ?>"></script>
  <script src="<?= includeFile('task/directive.js') ?>"></script>
  <script src="<?= includeFile('groupRequests/groupRequestsController.js') ?>"></script>
  <script src="<?= includeFile('groupAdmin/groupAdminController.js') ?>"></script>
  <script src="<?= includeFile('groupAdmin/groupAdminIndexController.js') ?>"></script>
  <script src="<?= includeFile('userInfos/controller.js') ?>"></script>
  <?php if ($usesForum): ?>
    <script src="<?= includeFile('forum/forumIndexController.js') ?>"></script>
    <script src="<?= includeFile('forum/forumFilterController.js') ?>"></script>
    <script src="<?= includeFile('shared/treeviewDirective.js') ?>"></script>
  <?php endif; ?>
  <script src="<?= includeFile('forum/forumThreadController.js') ?>"></script>
<?php else: ?>
  <script src="<?= includeFile('vendor.min.js') ?>"></script>
  <script src="<?= includeFile('algorea.min.js') ?>"></script>
  <script src="<?= includeFile('templates.js') ?>"></script>
<?php endif; ?>
</body>
</html>