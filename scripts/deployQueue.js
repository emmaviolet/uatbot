// Description:
// deployQueue manages the queue for all application deploys.

// Commands:
// deploy schedule <application>   - schedules a deploy for an application
// deploy unschedule <application> - cancel deploy schedule for an application
// deploy start <application>      - starts a deploy for an application
// deploy cancel <application>     - cancels a deploy for an application
// deploy complete <application>   - completes the application deploy and removes the user from the deployment queue
// deploy next <application>       - return the first user in the deployment queue for the given application
// deploy status <application>     - returns all the users in the deployment queue for the given application

// Author:
// @lostie

module.exports = function(robot) {
  var roomSettings;
  var applications = [
    'alpaca',
    'bank-pool',
    'bilcas',
    'bilcas_stub',
    'cashbook',
    'codas',
    'cream',
    'crm_service_layer',
    'dispatcher',
    'fca-frontend',
    'funding_circle_app',
    'hubot-fundingcircle',
    'loan_engine',
    'loan_fuel',
    'lovelace',
    'marketplace',
    'transfers',
    'uk-gateway',
    'wall-e'
  ];
  var onGoingDeploys;

  function arrayToHash(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) {
      hash[array[i]] = null;
    };
    return hash;
  };

  function arrayToQueue(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) {
      hash[array[i]] = [];
    };
    return hash;
  };

  function getRoomSettings() {
    if(!robot.brain.get('roomSettings')) { robot.brain.set('roomSettings', {}) }
    return robot.brain.get('roomSettings');
  };

  function getDeployQueue() {
    if(!robot.brain.get('deployQueue')) { robot.brain.set('deployQueue', arrayToQueue(applications)) };
    return robot.brain.get('deployQueue');
  };

  function getOnGoingDeploys() {
    if(!robot.brain.get('onGoingDeploys')) { robot.brain.set('onGoingDeploys', arrayToHash(applications)) };
    return robot.brain.get('onGoingDeploys');
  };

  function getOnGoingDeploy(application) {
    onGoingDeploys = getOnGoingDeploys();
    return onGoingDeploys[application];
  };

  function setOnGoingDeploy(application, value) {
    onGoingDeploys = getOnGoingDeploys();
    onGoingDeploys[application] = value;
  };

  function applicationName(msg) { return (msg.match[1]).toLowerCase() };

  function userIsFirstToDeploy(user, application) {
    deployQueue = getDeployQueue();
    return user == deployQueue[application][0];
  }

  function nextUserToDeploy(application) {
    deployQueue = getDeployQueue();
    return deployQueue[application][0];
  }

  robot.hear(/deploy help/, function (msg) {
      msg.send(
          'deploy schedule <application>   - schedules a deploy for an application\n' +
          'deploy unschedule <application> - cancel deploy schedule for an application\n' +
          'deploy start <application>      - starts a deploy for an application\n' +
          'deploy cancel <application>     - cancels a deploy for an application\n' +
          'deploy complete <application>   - completes the application deploy and removes the user from the deployment queue\n' +
          'deploy next <application>       - return the first user in the deployment queue for the given application\n' +
          'deploy status <application>     - returns all the users in the deployment queue for the given application\n'
      );
  });

  robot.hear(/deploy schedule ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    applicationQueue.push(user);

    if(userIsFirstToDeploy(user, application)){
      msg.emote('You are next to deploy ' + application + '. Check for ongoing deploys before starting yours.');
    }
    else {
      msg.emote('Deploy scheduled for ' + application + '. Check status of queue.');
    }
  });

  robot.hear(/deploy unschedule ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    index = applicationQueue.indexOf(user);
    if(index == -1){
      msg.emote('You have no scheduled deploys for ' + application);
    }
    else {
      applicationQueue.splice(index, 1);
      msg.emote('Your scheduled deploy was cancelled for ' + application);
    }
  });

  robot.hear(/deploy start ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy(application);
    if(activeDeployUser !== null){
      msg.emote('You cannot start a deploy when there is an ongoing deploy for ' + application + ' by ' + activeDeployUser);
      return 0;
    }

    deployQueue = getDeployQueue();
    deployUser = deployQueue[application][0];

    if(deployUser != user){
      msg.emote('You are not the first in the queue to deploy ' + application + '. Next to deploy is ' + deployUser);
      return 0;
    }

    deployQueue[application].shift();
    setOnGoingDeploy(application, deployUser);
    msg.emote('You are now the active deploy user for ' + application);
  });

  robot.hear(/deploy complete ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy(application);
    if(activeDeployUser === null){
      msg.emote('There is no ongoing deploy for ' + application);
      return 0;
    }

    if(activeDeployUser != user){
      msg.emote('You cannot complete a deploy started by other user (' + activeDeployUser + ') for ' + application);
      return 0;
    }

    setOnGoingDeploy(application, null);
    msg.emote('Your deploy is now complete for ' + application + '. Next user to deploy: ' + nextUserToDeploy(application));
  });

  robot.hear(/deploy cancel ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy(application);
    if(activeDeployUser === null){
      msg.emote('There is no ongoing deploy for ' + application);
      return 0;
    }

    if(activeDeployUser != user){
      msg.emote('You cannot cancel a deploy started by other user (' + activeDeployUser + ') for ' + application);
      return 0;
    }

    setOnGoingDeploy(application, null);
    msg.emote('Your deploy is now cancelled for ' + application + '. Next user to deploy: ' + nextUserToDeploy(application));
  });

  robot.hear(/deploy next ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    var nextUser = nextUserToDeploy(application);
    if(nextUser === undefined){
      msg.emote('There are no scheduled users to deploy');
      return 0;
    }

    msg.emote('Next user to deploy ' + application + ': ' + nextUserToDeploy(application));
  });

  robot.hear(/deploy status ([\w-]+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.emote('Application ' + application + ' is not registered for deploy management');
      return 0;
    }

    var applicationQueueStatus;
    if(applicationQueue.length === 0){
      applicationQueueStatus  = 'There are no scheduled users to deploy ' + application;
    }
    else {
      var scheduledUsers='';
      for (var i in applicationQueue) {
        scheduledUsers += applicationQueue[i] + '\n';
      };
      applicationQueueStatus = 'Scheduled users to deploy for ' + application + ':\n' + scheduledUsers;
    }

    var onGoingDeployStatus = '';
    var onGoingDeployUser = getOnGoingDeploy(application);
    if(onGoingDeployUser === null){
      onGoingDeployStatus = 'There is no ongoing deploy for ' + application;
    }
    else {
      onGoingDeployStatus = 'Ongoing deploy started by ' + onGoingDeployUser + ' for ' + application;
    }

    msg.emote(applicationQueueStatus + '\n' + onGoingDeployStatus);
  });
};
