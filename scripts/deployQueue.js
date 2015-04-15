// Description:
// deployQueue manages the queue for all application deploys.

// Commands:
// deploy schedule <application>   - schedules a deploy for an application
// deploy unschedule <application> - cancel deploy schedule for an application
// deploy start <application>      - starts a deploy for an application
// deploy cancel <application>     - cancels a deploy for an application
// deploy complete <application>   - completes the application deploy and removes the user from the deployment queue
// deploy frontline <application>  - return the first user in the deployment queue for the given application
// deploy status <application>     - returns all the users in the deployment queue for the given application

// Author:
// @lostie

module.exports = function(robot) {
  var roomSettings;
  var fcApplications = [
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
  var onGoingDeploy;

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
    if(!robot.brain.get('deployQueue')) { robot.brain.set('deployQueue', arrayToQueue(fcApplications)) };
    return robot.brain.get('deployQueue');
  };

  function getOnGoingDeploy() {
    return robot.brain.get('onGoingDeploy');
  };

  function setOnGoingDeploy(value) {
    robot.brain.set('onGoingDeploy', value);
  };

  function applicationName(msg) { return (msg.match[1]).toLowerCase() };

  function frontlineUser(application) {
    deployQueue = getDeployQueue();
    return deployQueue[application][0];
  }

  function userIsInFrontline(user, application) {
    deployQueue = getDeployQueue();
    return user == deployQueue[application][0];
  }

  robot.hear(/deploy schedule (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    applicationQueue.push(user);

    if(userIsInFrontline(user, application)){
      msg.send('You are next to deploy ' + application + '. Check for ongoing deploys before starting yours.');
    }
    else {
      msg.send('Deploy scheduled for ' + application + '. Check status of queue.');
    }
  });

  robot.hear(/deploy unschedule (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    index = applicationQueue.indexOf(user);
    if(index == -1){
      msg.send('You have no schedule deploys for ' + application);
    }
    else {
      applicationQueue.splice(index, 1);
      msg.send('Your scheduled deploy was cancelled for ' + application);
    }
  });

  robot.hear(/deploy start (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy();
    if(activeDeployUser !== undefined){
      msg.send('You cannot start a deploy where there is an ongoing deploy for ' + application + ' by ' + activeDeployUser);
      return 0;
    }

    deployQueue = getDeployQueue();
    deployUser = deployQueue[application][0];

    if(deployUser != user){
      msg.send('You cannot start a deploy scheduled by other user (' + deployUser + ') for ' + application);
      return 0;
    }

    deployQueue[application].shift();
    setOnGoingDeploy(deployUser);
    msg.send('You are now the active deploy user for ' + application);
  });

  robot.hear(/deploy complete (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy();
    if(activeDeployUser != user){
      msg.send('You cannot complete a deploy started by other user (' + activeDeployUser + ') for ' + application);
      return 0;
    }

    setOnGoingDeploy(undefined);
    msg.send('Your deploy is now complete for ' + application + '. Next user in the frontline: ' + userIsInFrontline());
  });

  robot.hear(/deploy cancel (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    activeDeployUser = getOnGoingDeploy();
    if(activeDeployUser != user){
      msg.send('You cannot cancel a deploy started by other user (' + activeDeployUser + ') for ' + application);
      return 0;
    }

    setOnGoingDeploy(undefined);
    msg.send('Your deploy is now complete for ' + application + '. Next user in the frontline: ' + userIsInFrontline());
  });

  robot.hear(/deploy frontline (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    msg.send('Next user in frontline: ' + userIsInFrontline());
  });

  robot.hear(/deploy status (\w+)/, function(msg) {
    deployQueue = getDeployQueue();
    var application = applicationName(msg);
    var user = msg.envelope.user.name;

    applicationQueue = deployQueue[application];
    if(applicationQueue === undefined){
      msg.send('Application ' + application + 'is not registered for deploy management');
      return 0;
    }

    scheduledUsers='';
    for (var scheduledUser in applicationQueue) {
      scheduledUsers += scheduledUser + '\n';
    };
    msg.send('Scheduled users to deploy for application ' + application + ':\n' + scheduledUsers);
  });
};
