module.exports = function(robot) {
  var uatNames = [
    'astroboy', 'derbystallion', 'donkeykong', 'doubledragon', 'galaga',
    'ghostbusters', 'goldeneye', 'kirby', 'mariogolf', 'metroid', 'mickeymania',
    'mortalkombat', 'pikmin', 'quake', 'starfox', 'yoshi', 'zelda'
  ];

  function arrayToHash(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) {
      hash[array[i]] = ''
    };
    return hash;
  };

  function getUatOwners() {
    owners = robot.brain.get('uatOwners');
    if(!owners) { robot.brain.set('uatOwners', arrayToHash(uatNames)) };
    return robot.brain.get('uatOwners');
  };

  function uatName(msg) { return (msg.match[1]).toLowerCase() };
  function uatFree() { return uat in uatOwners && uatOwners[uat] === '' };
  function uatOwnedByUser() { return uat in uatOwners && uatOwners[uat] === userName };

  function assignVariables(msg) {
    uat = uatName(msg);
    userName = msg.envelope.user.name;
    uatOwners = getUatOwners();
  };

  robot.hear(/uat grab (.*)/, function(msg) {
    assignVariables(msg);
    if(uatFree()) {
      uatOwners[uat] = userName;
      msg.send(userName + ' has grabbed ' + uat);
    } else if(uatOwnedByUser()) {
      msg.send('You already have ' + uat + ', ' + userName);
    } else if(uat in uatOwners) {
      msg.send(uatOwners[uat] + ' already has ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat release (.*)/, function(msg) {
    assignVariables(msg);
    if(uatFree()) {
      msg.send(uat + ' is not currently in use')
    } else if(uatOwnedByUser()) {
      uatOwners[uat] = '';
      msg.send(userName + ' has released ' + uat);
    } else if(uat in uatOwners) {
      msg.send(uatOwners[uat] + ' currently has ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat steal (.*)/, function(msg) {
    assignVariables(msg);
    if(uat in uatOwners) {
      uatOwners[uat] = userName;
      msg.send(userName + ' has stolen ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat status (.*)/, function(msg) {
    uatOwners = getUatOwners();
    uatList = '';

    if(msg.match[1] === 'all') {
      uatQueries = Object.keys(uatOwners);
    } else {
      uatQueries = msg.match[1].split(/[ ,]+/);
    }

    for(var i in uatQueries) {
      uat = uatQueries[i].toLowerCase();
      uatList += uat + ': ' + uatOwners[uat] + '\n';
    };
    msg.send(uatList);
  });
}
